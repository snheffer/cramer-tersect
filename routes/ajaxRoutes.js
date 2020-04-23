var express = require('express');
var router = express.Router();
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');
var dir = process.cwd();
var TersectIntegration = require('../models/tersectIntegration.js');
var TersectVCF = require('../models/TersectVCF.js');
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
//route for uploading a new Tersect Index (TSI) file.
router.post('/tersectUpload/new',isTersectAuthenticated, function(req,res,next){
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
//populator route for updating the list of items on the server.
router.get('/tersectUpload',isTersectAuthenticated, function(req,res,next){
    TersectIntegration.find(function(err,items){
        if(err){
            return console.error(err)
        }
        res.json(items)

    })
});
//populator route for updating the queries associated with the instance.
router.post('/tersectQueries',isTersectAuthenticated, function(req,res,next){
    console.error("Query Route Hit");
    console.error(req.body.idToGet);
    var query = {parent_id:req.body.idToGet};
    TersectVCF.find(query,function(err,items){
        if(err){
            return console.error(err)
        } else {
            console.error(JSON.stringify(items,null, 4));
        }
        res.json(items)

    })
});
//deletion route for deleting entries in the server database, and removing the files.
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

//uploader route for uploading new vcf files to generate new TSI files, and add them to the database.
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

router.post('/tersectUpload/view',function(req,res,next){
    query = {_id:req.body.tsifile}
    TersectIntegration.findOne(query, function(err,entry){
        if (err){
            console.error('File Deletion Error: Cant Find Ref: ' + err)
        } else {
            console.log(entry.name)
            var arr = [];
            var getSamples = spawn('tersect', ['samples', entry.route], { shell: true });
            //The output of the command is printed in the command line if there are no errors
            getSamples.stdout.on('data', (data) => {
                //each sample name is on a new line, split by new line
                arr = data.toString().trim().split('\n');
                //remove first item - Sample
                arr.shift();
            });
            //prints error from running tersect
            getSamples.stderr.on('data', (data) => {
                console.error(`tersect stderr: ${data}`);

            });
            //prints after command is complete if there was an error
            getSamples.on('close', (code) => {
                res.send({ "samples": arr });

                if (code !== 0) {
                    console.log(`tersect process exited with code ${code}`);
                }

            });
        }
    })
});


//add file path to tsi file to run
function tersect(command, id, file, filepath) {
    console.log(command);
    query={_id:id};
    TersectIntegration.findOne(query, function(err,entry){
        if (err){
            console.error('File Deletion Error: Cant Find Ref: ' + err)
        } else {
            console.log(entry.route);
            var tcommand = spawn('tersect', ['view', entry.route, '"' + command +'"'], { shell: true });
            var output = fs.createWriteStream(filepath);
            tcommand.stdout.on('data', (data) => {
                output.write(data);
            });


            tcommand.stderr.on('data', (data) => {
                console.error(`tersect stderr: ${data}`);
            });

            tcommand.on('close', (code) => {
                if (code !== 0) {
                    console.log(`tersect process exited with code ${code}`);
                } else {
                    console.log('done!');
                    var item = new TersectVCF({ name: file, command:encodeURIComponent(command), parent_id:id,  route: filepath});
                    item.save(function (err, item) {
                        if (err) {
                            return console.error(err)
                        } else {
                            console.error("Query VCF added to TersectVCF")
                        }
                    });
                }
            });
        }
})}

router.post('/generate',function(req,res,next){
    var comm = req.body.command;
    var mapObj = {
        A:"u" + req.body.setA.toString().replace(/\[/g, "(").replace(/\]/g, ")").replace(/"/g, ""),
        B:"u" + req.body.setB.toString().replace(/\[/g, "(").replace(/\]/g, ")").replace(/"/g, ""),
        C:"u" + req.body.setC.toString().replace(/\[/g, "(").replace(/\]/g, ")").replace(/"/g, "")
    };
    var fullCommand = comm.replace(/A|B|C/g, function(matched){
        return mapObj[matched];
    });


    var id = req.body.idToGet;
    var file = req.body.filepath;
    var filepath = path.join(__dirname, "../newVCF/"+ file);

    //convert samples selected into tersect format u()
    console.error("ID: "+req.body.idToGet);
    console.error("Command: "+ comm);
    console.error("Fullcommand: "+fullCommand);
    tersect(fullCommand,id, file,filepath);
    res.send({ "location": filepath });
});
// //router.post(tersect)
// function recursiveRenamer(file,form,curr_path){
//     fs.stat(curr_path, function (err, stats) {
//
//         if(stats){
//         curr_path = path.join(form.uploadDir,(path.basename(curr_path).replace(/\.[^/.]+$/, "")+"(copy)"+path.extname(curr_path)));
//         console.log(curr_path);
//         recursiveRenamer(file,form,curr_path)
//     } else {
//         fs.renameSync(file.path, curr_path);
//         //return curr_path
//     }
//
//     })
// }



module.exports = router;
