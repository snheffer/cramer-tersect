var express = require('express');
var router = express.Router();
var path = require('path');
var formidable = require('formidable');
var rimraf = require('rimraf');
var fs = require('fs');
var dir = process.cwd();
var GenoverseInstance = require('../models/GenoverseInstance.js');
var TersectIntegration = require('../models/tersectIntegration.js');
var TersectVCF = require('../models/TersectVCF.js');
var utils = require('../routes/utils.js');
var { v4: uuid } = require('uuid');
const {spawn} = require('child_process');

try {
    if (!fs.existsSync(path.join(dir+"/vcf"))){
        fs.mkdirSync(path.join(dir+"/vcf"))
    }
} catch(err) {
    console.error(err)
}
try {
    if (!fs.existsSync(path.join(dir+"/newVCF"))) {
        fs.mkdirSync(path.join(dir+"/newVCF"))
    }
} catch(err) {
    console.error(err)
}

isUploadAuthenticated = function (req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        req.destroy()
    }
};

isTersectAuthenticated = function (req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.status(403).send({
            message: 'Error:Not Logged in.'
        });
    }
};

////Uploader Routes --------------------------------------------------------

//route for uploading a new Tersect Index (TSI) file.
router.post('/tersectUpload/new',isUploadAuthenticated, function(req,res,next){
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
            fs.renameSync(file.path, newPath);
            console.error(file.path);
            console.error(instanceName[0]);
            var item = new TersectIntegration({ name: file.name, instance: instanceName[0].replace("CRAMER - ",""), local: true, route: newPath });
            item.save(function (err, item) {
                if (err) {
                    next(err);
                    console.error(err)
                }
            });
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

//uploader route for uploading new vcf files to generate new TSI files, and add them to the database.
router.post('/vcfUpload/new',isUploadAuthenticated, function(req,res,next){
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
        if (err){
            console.error(err);
            next(err)
        }
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
        child.on("error", err => {
            console.error(err)
            next(err);
        });
        child.on("close", (code, signal) => {

                var item = new TersectIntegration({
                    name: fields.newName,
                    instance: fields.instanceName.replace("CRAMER - ",""),
                    local: true,
                    route: (dir + "/indexes/" + newIndexName)
                });
                item.save(function (err, item) {
                    if (err) {
                        console.error(err)
                        next(err)
                    }
                });
        })
    });
    // parse the incoming request containing the form data
    form.parse(req);
});

////Populator Routes --------------------------------------------------------

//populator route for updating the list of TSI files on the server.
router.post('/tersectUpload', function(req,res,next){
    var instanceName = req.body.instanceName.replace("CRAMER - ","")
    var query = {instance:instanceName};
    TersectIntegration.find(query, function(err,items){
        if(err){
            console.error(err)
            next(err);
        }
        res.json(items)

    })
});
//populator route for updating the queries associated with the specific index file.
router.post('/tersectQueries', function(req,res,next){
    console.error("Query Route Hit");
    console.error(req.body.idToGet);
    var query = {parent_id:req.body.idToGet};
    TersectVCF.find(query,function(err,items){
        if(err){
            console.error(err);
            next(err);
        } else {
            console.error(JSON.stringify(items,null, 4));
        }
        res.json(items)

    })
});

//Route for populating sample list for the Venn GUI.
router.post('/tersectUpload/view',function(req,res,next){
    query = {_id:req.body.tsifile};
    TersectIntegration.findOne(query, function(err,entry){
        if (err){
            console.error('Population Error: Cant Find Ref: ' + err);
            next(err);
        } else {
            console.log(entry.name);
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

//route for using generated query VCFs to generate new Tracks.
router.post('/tersectQueries/newTracks',isTersectAuthenticated,function(req,res,next){
    var vcfFlag = req.body.vcfFlag;
    var densityFlag = req.body.densityFlag;
    var query = {_id:{$in:req.body.idsForTracks}};
    TersectVCF.find(query, function(err,items){
        if(err){
            console.error(err);
            next(err)
        }
        else {
            var secondQuery = {name:req.body.instanceName.replace("CRAMER - ","")};
            console.error("Instance Name: "+req.body.instanceName.replace("CRAMER - ",""));
            console.error("Instance Name: "+req.body.idsForTracks);
            console.error("Instance VCF Flag: "+typeof(req.body.vcfFlag));
            console.error("Instance Density Flag: "+typeof(req.body.densityFlag));
            GenoverseInstance.findOne(secondQuery,function(err,entry){
                if(err){
                    console.log(err);
                    next(err);
                }
                else {
                    if(vcfFlag == 1) {
                        entry.tracks.filter(function (track) {
                            if (track.group === "VCF") {
                                items.forEach(function (current) {
                                    track.trackChildren.push({
                                        "name": current.name,
                                        "description": current.command,
                                        'data': 'Genoverse.Track.File.VCF.extend({\nname: "' + current.name + '",\ninfo: "' + current.command + '",\nmodel: Genoverse.Track.Model.File.VCF.extend({\nurl: "http://localhost:4000/index/request?chr=__CHR__&start=__START__&end=__END__&type=tabix",\nlargeFile: true,\nurlParams: {file: "' + current.route + '"}\n})\n})'
                                    })

                                })

                            }
                        });
                    };
                    if(densityFlag == 1) {
                        entry.tracks.filter(function (track) {
                            if (track.group === "SNP Density") {
                                items.forEach(function (current) {
                                    track.trackChildren.push({
                                        "name": current.name,
                                        "description": current.command,
                                        'data': 'Genoverse.Track.SNPDensity.extend({\nname: "' + current.name + '",\ninfo: "' + current.command + '",\nmodel: Genoverse.Track.Model.SNPDensity.extend({\nurl: "http://localhost:4000/index/request?chr=__CHR__&start=__START__&end=__END__&type=tabix",\nlargeFile: true,\nurlParams: {file: "' + current.route + '"}\n})\n})'
                                    })

                                })

                            }
                        });
                    };
                    entry.save(function (err) {
                        if (err) {
                            next(err);
                            console.log(err);
                        } else {
                            console.log('Instance modified !');
                            res.send('Success');
                        }
                    });
                }
            })
        }
    })
});

////Deletion Routes --------------------------------------------------------

//deletion route for deleting entries in the TSI database, and removing the associated query VCF files.
router.delete('/tersectUpload/:id',isTersectAuthenticated, function(req,res,next){
    let query = {_id:req.params.id};
    let childQuery = {parent_id:req.params.id};
    TersectIntegration.findOneAndDelete(query, function(err,entry){
        if (err){
            console.error('File Deletion Error: Cant Find Ref: ' + err);
            next(err);
        } else {
            rimraf(entry.route,function(err){
                if(err){
                    console.error('File Deletion Error: Cant Delete File at: ' + entry.route + ', ' + err)
                    next(err);
                } else {
                    TersectVCF.find(childQuery,function(err,entries){
                        if(err){
                            console.error("error with tersectVCF delete")
                            next(err);
                        } else {
                            entries.forEach(function(current){
                                rimraf(path.dirname(current.route), function(err){
                                    if(err){
                                        console.error('error in /tersectUpload query VCF deletion: ' + err);
                                        next(err);
                                    }
                                })
                            })
                            TersectVCF.deleteMany(childQuery,function(err){
                                if(err){
                                    console.error('error in /tersectUpload query VCF database removal: ' + err);
                                    next(err);
                                } else res.send('success')
                            })
                        }
                    })
                }
            });
        }
    })
});

//deletion route for deleting entries in the QueryVCF database, and removing the files.
router.delete('/tersectQueries/:id',isTersectAuthenticated, function(req,res,next){
    let query = {_id:req.params.id};
    TersectVCF.findOneAndDelete(query, function(err,entry){
        if (err){
            console.error('File Deletion Error: Cant Find Ref: ' + err);
            next(err);
        } else {
            rimraf(path.dirname(entry.route),function(err){
                if(err){
                    console.error("Error in /tersectQueries Delete Route: " + err)
                    next(err);
                } else {
                    res.send('success')
                }
            })
        }
    });


});

////Query Generation Routes --------------------------------------------------------

//add file path to tsi file to run
function tersect(command, id, file, filepath) {
    console.log(command);
    query={_id:id};
    TersectIntegration.findOne(query, function(err,entry){
        if (err){
            console.error('Cant Find Ref: ' + err);
            next(err);
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
            tcommand.on('exit', (code) => {
                if (code !== 0) {
                    console.log(`tersect process exited with code ${code}`);
                } else {
                    console.log('done!');
                    var bgzipcommand = spawn('bgzip',[filepath]);
                    bgzipcommand.stderr.on('data', (data) => {console.error(`bgzip stderr: ${data}`);});
                    bgzipcommand.on('exit', (code) => {
                        if (code !== 0) {
                            console.log(`bgzip process exited with code ${code}`);
                        } else {
                            var filePathForTabix = filepath+'.gz';
                            var tabixcommand = spawn('tabix',[filePathForTabix]);
                            tabixcommand.stderr.on('data', (data) => {console.error(`tabix stderr: ${data}`);});
                            tabixcommand.on('close', (code) => {
                                if (code !== 0) {
                                    console.log(`tabix process exited with code ${code}`);
                                } else {
                                    var item = new TersectVCF({ name: file, command:encodeURIComponent(command), parent_id:id,  route: filePathForTabix});
                                    item.save(function (err, item) {
                                        if (err) {
                                            return console.error(err);
                                            next(err);
                                        } else {
                                            console.error("Query VCF added to TersectVCF");
                                        }
                                    });

                                }

                            });
                        }

                    });

                }
            });
        }
})}

router.post('/tersectQueries/generate',function(req,res,next){
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
    var file = req.body.filepath.replace(/ /g,"_");
    var newPath = path.join(__dirname, "../newVCF/"+uuid()+"/");
    var filepath = path.join(newPath+ file);

    fs.mkdir(newPath, { recursive: true }, (err) => {
        if (err){
            console.error("Error in making tersect query directory: " + err)
            next(err)
        } else {
            tersect(fullCommand,id, file,filepath);
            console.error("ID: "+req.body.idToGet);
            console.error("Command: "+ comm);
            console.error("Fullcommand: "+fullCommand);
            res.send({ "location": filepath });

        }
    });
});

////Query VCF Download Route ---------------------------------

router.post('/tersectQueries/:id/download', function(req, res, next){
    var query = {_id:req.params.id};
    console.error(req.params.id)
    TersectVCF.findOne(query,function(err,entry){
        if(err){
            console.error("Cant find file for download id.");
            next(err);
        }
        else {
            var file = entry.route;
            res.set('Content-Type', 'application/gzip')

            res.download(file);
        }
    })
});

module.exports = router;
