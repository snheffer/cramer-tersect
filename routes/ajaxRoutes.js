var express = require('express');
var router = express.Router();
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');
var dir = process.cwd();
var TersectIntegration = require('../models/tersectIntegration.js');
var utils = require('../routes/utils.js');
var { v4: uuid } = require('uuid');
const {spawn} = require('child_process');
isTersectAuthenticated = function (req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        req.flash('warning', 'Please login to use this functionality.');
    }
};

router.post('/tersectUpload',isTersectAuthenticated, function(req,res,next){
        // create an incoming form object
        var form = new formidable.IncomingForm();
        var instanceName = [];
        // specify that we want to allow the user to upload multiple files in a single request
        form.multiples = false;
        form.maxFileSize = 5 * 1024 * 1024 * 1024;

        // store all uploads in the /uploads directory
        form.uploadDir = path.join(__dirname, '../indexes');
        // every time a file has been uploaded successfully,
        // rename it to it's original name
        form.on('field',function(name,field){
            instanceName.push(field);

        });
        form.on('file', function(field, file) {
            var newPath = path.join(form.uploadDir,file.name);
            newPath = path.join(form.uploadDir,(path.basename(newPath).replace(/\.[^/.]+$/, "")+"_"+uuid()+path.extname(newPath)));
            //console.log(newPath);
            fs.renameSync(file.path, newPath);
            //recursiveRenamer(file,form,newPath);
            console.error(file.path);
            console.error(instanceName[0]);
            var item = new TersectIntegration({ name: file.name, instance: instanceName[0], local: true, route: newPath });
            item.save(function (err, item) {
                if (err) {
                    return console.error(err)
                }
            });
            TersectIntegration.find(function(err,items){
                if(err){
                    return console.error(err)
                }
                console.log(items)

            })
        });
        // log any errors that occur
        form.on('error', function(err) {
            console.log('An error has occurred: \n' + err);
            req.pause();

            res.writeHead(413, {'Content-Type': 'text/plain'});
            res.end('5GB max')
        });
        // once all the files have been uploaded, send a response to the client
        form.on('end', function() {
            res.end('success');
        });
        // parse the incoming request containing the form data
        form.parse(req);
});
router.get('/tersectUpload',isTersectAuthenticated, function(req,res,next){
    TersectIntegration.find(function(err,items){
        if(err){
            return console.error(err)
        }
        res.json(items)

    })
});

router.delete('/tersectUpload/:id',isTersectAuthenticated, function(req,res,next){
    let query = {_id:req.params.id};
    TersectIntegration.findOne(query, function(err,entry){
        if (err){
            console.error('File Deletion Error: Cant Find Ref: ' + err)
        } else {
            fs.unlink(entry.route,function(err){
                if(err){
                    console.error('File Deletion Error: Cant Delete File at: ' + entry.route + ', ' + err)
                }
            });
        }
    })
    TersectIntegration.deleteOne(query,function(err){
        if(err){
            console.error('Entry Deletion Error: Can\'t Delete DB Entry at: ' + err);
        } else {
            res.send('Success');
        }
    });

});

// router.post('/vcfUpload',isTersectAuthenticated,function(req,res,next){
//
//
// });


router.post('/vcfUpload',isTersectAuthenticated, function(req,res,next){
    // create an incoming form object
    var form = new formidable.IncomingForm();
    var fields = {};
    var files = [];
    // specify that we want to allow the user to upload multiple files in a single request
    form.multiples = false;
    form.maxFileSize = 5 * 1024 * 1024 * 1024;
    var randomDirName = uuid();
    var newPath = path.join(__dirname, "../vcf/"+randomDirName);
    fs.mkdir(newPath, { recursive: true }, (err) => {
        if (err) throw err;
    });

    // store all uploads in the ../vcf/ directory in a random directory.
    form.uploadDir = newPath;
    // every time a file has been uploaded successfully,
    // rename it to it's original name
    form.on('field',function(name,field){
        fields[name] = field;
    });
    form.on ('fileBegin', function(name, file){
        //rename the incoming file to the file's name
        if(file.name.endsWith("vcf")){
            file.path = form.uploadDir + "/" + path.basename(file.name)+"_"+uuid()+".vcf";

        }
        if(file.name.endsWith("vcf.gz")){
            file.path = form.uploadDir + "/" + path.basename(file.name)+"_"+uuid()+".vcf.gz";

        }
        // file.path = form.uploadDir + "/" + path.basename(file.name)+"_"+uuid()+path.extname(file.name);
    });
    form.on('file', function(name, file) {
        files.push(file);
    });
    // log any errors that occur
    form.on('error', function(err) {
        console.log('An error has occurred: \n' + err);
        req.pause();

        res.writeHead(413, {'Content-Type': 'text/plain'});
        res.end('5GB max')
    });
    // once all the files have been uploaded, send a response to the client
    form.on('end', function() {
        res.end('success');
        console.error(JSON.stringify(fields, null, 4));
        console.error(JSON.stringify(files, null, 4));
        const newIndexName =  fields.newName+"_"+uuid()+ ".tsi";
        const child = spawn("tersect", ["build", newIndexName,"../vcf/"+randomDirName+"/*"], {cwd: dir + "/indexes"});
        child.on("error", err => {console.error(err)});
        child.on("close", (code, signal) => {
            var item = new TersectIntegration({ name: fields.newName, instance: fields.instanceName, local: true, route: (dir+"/indexes/"+newIndexName)});
            item.save(function (err, item) {
                if (err) {
                    return console.error(err)
                }
            });

        })
    });
    // parse the incoming request containing the form data
    form.parse(req);
});

//router.post(tersect)
function recursiveRenamer(file,form,curr_path){
    fs.stat(curr_path, function (err, stats) {

        if(stats){
        curr_path = path.join(form.uploadDir,(path.basename(curr_path).replace(/\.[^/.]+$/, "")+"(copy)"+path.extname(curr_path)));
        console.log(curr_path);
        recursiveRenamer(file,form,curr_path)
    } else {
        fs.renameSync(file.path, curr_path);
        //return curr_path
    }

    })
}



module.exports = router;
