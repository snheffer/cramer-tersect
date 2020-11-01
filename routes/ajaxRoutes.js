var express = require('express');
var router = express.Router();
var path = require('path');
var formidable = require('formidable');
var rimraf = require('rimraf');
var ip = require('ip');
var fs = require('fs');
require('lodash.combinations');
var _ = require('lodash');
var GenoverseInstance = require('../models/GenoverseInstance.js');
var TersectIntegration = require('../models/tersectIntegration.js');
var TersectVCF = require('../models/TersectVCF.js');
var utils = require('../routes/utils.js');
var { v4: uuid } = require('uuid');
const {spawn} = require('child_process');
const {spawnSync} = require('child_process');

var dir = path.join(__dirname,"..");


try {
    if (!fs.existsSync(path.join(dir,"vcf"))){
        fs.mkdirSync(path.join(dir,"vcf"))
    }
} catch(err) {
    console.error("Error making VCF directory:" + err)
}
try {
    if (!fs.existsSync(path.join(dir,"newVCF"))) {
        fs.mkdirSync(path.join(dir,"newVCF"))
    }
} catch(err) {
    console.error("Error making newVCF directory:" + err)
}

isUploadAuthenticated = function (req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        req.destroy();
        res.status(403).send({
            message: 'Error:Not Logged in.'
        });
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
    // specify that we dont want to allow the user to upload multiple files in a single request
    var form = new formidable({multiples:false,maxFileSize:5368709120,uploadDir:path.join(dir,'indexes')});
    var newPath = "";
    form.parse(req, function(err,fields,files){
        if(err){
            req.pause();
            res.writeHead(413, {'Content-Type': 'text/plain'});
            res.end('Tersect Error')
        } else {
            console.log(JSON.stringify(files));
            newPath = path.join(form.uploadDir,fields.instanceID)
            if(files["uploads[]"].name.match(/\.(TSI|tsi)$/i)) {
                fs.mkdir(newPath, { recursive: true }, (err) => {
                    if (err){
                        req.pause();
                        res.writeHead(413, {'Content-Type': 'text/plain'});
                        res.end('Tersect Error')
                    } else {
                        newPath = path.join(form.uploadDir,fields.instanceID,files["uploads[]"].name);
                        newPath = path.join(form.uploadDir,fields.instanceID,(path.basename(newPath).replace(/\.[^/.]+$/, "")+"_"+uuid()+path.extname(newPath)));
                        console.log("newpath: "+newPath);
                        fs.renameSync(files["uploads[]"].path, newPath);
                        var flag = false;
                        var sampleCheck = spawnSync('tersect',["samples",newPath,"-m","'*'"],{shell:true});
                        var sampleCheckOutput = sampleCheck.stdout;
                        console.log(sampleCheckOutput);
                        sampleCheckOutput = sampleCheckOutput.toString().trim().split('\n');
                        // for (var name of sampleCheckOutput){
                        //     if(name.endsWith("*")){
                        //         flag = true;
                        //         break
                        //     }
                        // }
                        if(flag){
                            res.writeHead(500, {'Content-Type': 'text/plain'});
                            res.end('Tersect Index Contains Samples With Wildcard In Their Names. Will not work with current iteration of CRAMER/Tersect')
                            console.log('Tersect Index Contains Samples With Wildcard In Their Names. Will not work with current iteration of CRAMER/Tersect')
                            rimraf(newPath, function(err){
                                if(err){
                                    console.error("Error deleting file located at: " + newPath)
                                } else console.error("Deleted file located at: " + newPath)
                            })
                        } else {
                            sampleCheckOutput.shift();
                            var idTable = utils.arraysToDict(sampleCheckOutput,utils.idGen(sampleCheckOutput.length));
                            var idTableText = "";
                            for(var i in idTable){
                                console.log(i)
                                idTableText = idTableText + `${i}\t${idTable[i]}\n`
                            }
                            var idtableTextOutput = idTableText;
                            fs.writeFile(newPath+'.tsv', idtableTextOutput, function (err) {
                                if (err){
                                    console.log(err)
                                } else {
                                    console.log("Name File Wrote successfully")
                                    const child = spawn("tersect", ["rename", newPath, "-n", newPath+'.tsv'], {shell:true, cwd: path.join(dir,"indexes")});
                                    child.on("error", err => {
                                        console.error(err);
                                    });
                                    child.on("close", (code, signal) => {
                                        if (code !== 0) {
                                            console.error(`tersect process exited with code ${code}`);
                                        } else {
                                            console.log("Tersect Rename Successful")
                                            var item = new TersectIntegration({
                                                name: files["uploads[]"].name,
                                                instance_id: fields.instanceID,
                                                local: true,
                                                route: newPath,
                                                aliases: idTable });
                                            item.save(function (err, item) {
                                                if (err) {
                                                    console.error(err);
                                                    res.writeHead(500, {'Content-Type': 'text/plain'});
                                                    res.end('Tersect Database Error')
                                                } else {
                                                    res.end("success");
                                                    console.log("saved to DB!")
                                                }
                                            });
                                        }
                                    });
                                }

                                console.log('.tsv written');
                            });

                        }
                    };
                });

            } else {
                console.log(files["uploads[]"].name + " is not allowed");
                req.pause();
                res.writeHead(422, {'Content-Type': 'text/plain'});
                res.end('Wrong File Type')
            }
        }
    });

});

//uploader route for uploading new vcf files to generate new TSI files, and add them to the database.
router.post('/vcfUpload/new',isUploadAuthenticated, function(req,res,next){
    var randomDirName = uuid();
    var newPath = path.join(dir, "vcf", randomDirName);
    fs.mkdir(newPath, { recursive: true }, (err) => {
        if (err){
            console.error(err);
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end('Tersect Database Error')
        } else {console.log("making newPath directory...")
            // create an incoming form object
            var form = new formidable.IncomingForm();
            var fields = {};
            var files = [];
            // specify that we want to allow the user to upload multiple files in a single request
            form.multiples = false;
            form.maxFileSize = 5 * 1024 * 1024 * 1024;
            // log any errors that occur
            form.on('error', function(err) {
                console.log('An error has occurred: \n' + err);
                req.pause();
                if(err.message === "fileType"){
                    res.writeHead(422, {'Content-Type': 'text/plain'});
                    res.end('Wrong File Type')
                } else if(err.message === "database" ){
                    res.writeHead(500, {'Content-Type': 'text/plain'});
                    res.end('Tersect Database Error')
                } else {
                    res.writeHead(413, {'Content-Type': 'text/plain'});
                    res.end('Tersect Error')
                }
            });
            // store all uploads in the ../vcf/ directory in a random directory.
            form.uploadDir = newPath;
            // every time a file has been uploaded successfully,
            // rename it to it's original name
            form.on('field',function(name,field){
                fields[name] = field;
                console.log(JSON.stringify(fields))
            });
            form.on ('fileBegin', function(name, file){
                //rename the incoming file to the file's name
                if(file.name.toLowerCase().endsWith(".vcf")){
                    file.path = form.uploadDir + "/" + path.basename(file.name)+"_"+uuid()+".vcf";

                } else if (file.name.toLowerCase().endsWith(".vcf.gz")){
                    file.path = form.uploadDir + "/" + path.basename(file.name)+"_"+uuid()+".vcf.gz";

                } else {form.emit("error", new Error("fileType"))}
            });
            form.on('file', function(name, file) {
                files.push(file);
                console.log(JSON.stringify(files))
            });
            // once all the files have been uploaded, send a response to the client
            form.on('end', function() {
                GenoverseInstance.exists({_id:fields.instanceID}, function(err, result){
                    if(err){
                        form.emit("error", new Error("database"))
                    } else {
                        fs.mkdir(path.join(dir,"indexes",fields.instanceID), { recursive: true }, (err) => {
                            if (err){
                                req.pause();
                                res.writeHead(413, {'Content-Type': 'text/plain'});
                                res.end('Tersect Error')
                            } else{
                                res.end('success');
                                console.error("FIELDS: "+JSON.stringify(fields, null, 4));
                                console.error("FILES: "+JSON.stringify(files, null, 4));
                                fields.newName = fields.newName.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
                                const newIndexName =  fields.newName+"_"+uuid()+ ".tsi";
                                const child = spawn("tersect", ["build", newIndexName,path.join(dir,"vcf",randomDirName,"*")], {shell:true, cwd: path.join(dir,"indexes",fields.instanceID)});
                                child.on("error", err => {
                                    console.error(err);
                                });
                                child.stdout.on('data', function(data) {
                                    console.log(data.toString());
                                });
                                child.on("close", (code, signal) => {
                                    if (code !== 0) {
                                        console.error(`tersect process exited with code ${code}`);
                                    } else {
                                        var flag = false;
                                        var indexPath = path.join(dir, "indexes", fields.instanceID, newIndexName);
                                        var sampleCheck = spawnSync('tersect',["samples",indexPath,"-m","'*'"],{shell:true});
                                        var sampleCheckOutput = sampleCheck.stdout;
                                        console.log(sampleCheckOutput);
                                        sampleCheckOutput = sampleCheckOutput.toString().trim().split('\n');
                                        // for (var name of sampleCheckOutput){
                                        //     if(name.endsWith("*")){
                                        //         flag = true;
                                        //         break
                                        //     }
                                        // }
                                        if(flag){
                                            console.log('Tersect Index Contains Samples With Wildcard In Their Names. Will not work with current iteration of CRAMER/Tersect')
                                            rimraf(indexPath, function(err){
                                                if(err){
                                                    console.error("Error deleting file located at: " + indexPath)
                                                } else console.error("Deleted file located at: " + indexPath)
                                            });
                                            rimraf(newPath, function(err){
                                                if(err){
                                                    console.error("Error deleting file located at: " + newPath)
                                                } else console.error("Deleted file located at: " + newPath)
                                            })
                                        } else {
                                            sampleCheckOutput.shift();
                                            var idTable = utils.arraysToDict(sampleCheckOutput,utils.idGen(sampleCheckOutput.length));
                                            var idTableText = "";
                                            for(var i in idTable){
                                                console.log(i)
                                                idTableText = idTableText + `${i}\t${idTable[i]}\n`
                                            }
                                            var idtableTextOutput = idTableText;
                                            fs.writeFile(indexPath+'.tsv', idtableTextOutput, function (err) {
                                                if (err){
                                                    console.log(err)
                                                } else {
                                                    console.log("Name File Wrote successfully")
                                                    const child = spawn("tersect", ["rename", indexPath, "-n", indexPath+'.tsv'], {shell:true, cwd: path.join(dir,"indexes")});
                                                    child.on("error", err => {
                                                        console.error(err);
                                                    });
                                                    child.on("close", (code, signal) => {
                                                        if (code !== 0) {
                                                            console.error(`tersect process exited with code ${code}`);
                                                            rimraf(indexPath, function(err){
                                                                if(err){
                                                                    console.error("Error deleting file located at: " + indexPath)
                                                                } else console.error("Deleted file located at: " + indexPath)
                                                            });
                                                            rimraf(newPath, function(err){
                                                                if(err){
                                                                    console.error("Error deleting file located at: " + newPath)
                                                                } else console.error("Deleted file located at: " + newPath)
                                                            })
                                                        } else {
                                                            console.log("Tersect Rename Successful")
                                                            var item = new TersectIntegration({
                                                                name: fields.newName,
                                                                instance_id: fields.instanceID,
                                                                local: true,
                                                                route: indexPath,
                                                                aliases: idTable
                                                            });
                                                            item.save(function (err, item) {
                                                                if (err) {
                                                                    console.error(err);
                                                                    res.writeHead(500, {'Content-Type': 'text/plain'});
                                                                    res.end('Tersect Database Error');
                                                                    rimraf(indexPath, function(err){
                                                                        if(err){
                                                                            console.error("Error deleting file located at: " + indexPath)
                                                                        } else console.error("Deleted file located at: " + indexPath)
                                                                    });
                                                                } else {
                                                                    res.end("success");
                                                                    console.log("saved to DB!")
                                                                }
                                                            });
                                                            rimraf(newPath, function(err){
                                                                if(err){
                                                                    console.error("Error deleting file located at: " + newPath)
                                                                } else console.error("Deleted file located at: " + newPath)
                                                            })
                                                        }
                                                    });
                                                }
                                                console.log('.tsv written');
                                            });
                                        }

                                    }
                                })
                            };
                        });

                    }
                })
            });
            // parse the incoming request containing the form data
            form.parse(req);
        }
    });
});

////Populator Routes --------------------------------------------------------

//populator route for updating the list of TSI files on the server.
router.post('/tersectUpload', function(req,res,next){
    var instanceID = req.body.instanceID;
    GenoverseInstance.exists({_id: instanceID}, function(err, result){
        if (err){
            console.error("Document doesn't exist: " + err);
            res.status(500).send("Not Found")
        } else {
            var query = {instance_id:instanceID};
            TersectIntegration.find(query, function(err,items){
                if(err){
                    console.error("Error retrieving document: " + err);
                    res.status(404).send("Server Error");
                } else {
                    res.json(items)
                }
            })
        }
    })


});
//populator route for updating the queries associated with the specific index file.
router.post('/tersectQueries', function(req,res,next){
    if(!(req.body.idToGet)){
        res.status(404).send("No ID parameter specified")
    } else {
        TersectIntegration.exists({_id: req.body.idToGet}, function (err, result) {
            if (err) {
                console.error("Document doesn't exist: " + err);
                res.status(404).send("Not Found")
            } else {
                var query = {parent_id: req.body.idToGet};
                TersectVCF.find(query, function (err, items) {
                    if (err) {
                        console.error("Error with query VCF population route: " + err);
                        res.status(500).send("Tersect Error");
                    } else {
                        //console.error(JSON.stringify(items,null, 4));
                        res.json(items)
                    }
                })
            }
        });
    }
});

//Route for populating sample list for the Venn GUI.
router.post('/tersectUpload/view',function(req,res,next){
    if(!(req.body.tsifile)){
        res.status(400).send("No ID parameter specified")
    } else {
        var query = {_id:req.body.tsifile};
        TersectIntegration.findOne(query, function(err,entry){
            if (err){
                console.error("Population Error: Cant Find Ref: " + err);
                res.status(404).send("Resource Not Found.");
            } else {
                console.log(entry.name);
                var arr = []
                for (var i of entry.aliases.keys()){
                    arr.push(i)
                }
                res.send({ "samples": arr });
                // var arr = [];
                // var getSamples = spawn('tersect', ['samples', entry.route], { shell: true });
                // //The output of the command is printed in the command line if there are no errors
                // getSamples.stdout.on('data', (data) => {
                //     //each sample name is on a new line, split by new line
                //     arr = data.toString().trim().split('\n');
                //     //remove first item - Sample
                //     arr.shift();
                // });
                // getSamples.on("error", err => {
                //     console.error(err);
                //     if(err.message === "malformedTSI"){
                //         res.status(415).send("Corrupted Index!");
                //     } else {
                //         res.status(500).send("Tersect Error.")
                //     }
                // });
                // //prints error from running tersect
                // getSamples.stderr.on('data', (data) => {
                //     console.error(`Error in retrieving samples within TSI file: ${data}`);
                //     getSamples.emit("error", new Error("malformedTSI"))
                // });
                // //prints after command is complete if there was an error
                // getSamples.on('close', (code) => {
                //     if (code !== 0) {
                //         console.log(`tersect process exited with code ${code}`);
                //     } else {
                //         console.log(arr);
                //         res.send({ "samples": arr });
                //     }
                // });
            }
        })
    }
});

//route for using generated query VCFs to generate new Tracks.
router.post('/tersectQueries/newTracks',isTersectAuthenticated,function(req,res,next){
    if(!req.body.instanceName|| !req.body.instanceID || !req.body.idsForTracks || !req.body.vcfFlag || !req.body.densityFlag){
        res.status(403).send("Malformed Request.")
    } else {
        var vcfFlag = req.body.vcfFlag;
        var densityFlag = req.body.densityFlag;
        var query = {_id:{$in:req.body.idsForTracks}};
        TersectVCF.find(query, function(err,items){
            if(err){
                console.error("Resource Not Found" + err);
                res.send(404).send("Resource Not Found.")
            } else {
                var secondQuery = {_id:req.body.instanceID};
                GenoverseInstance.findOne(secondQuery,function(err,entry){
                    if(err){
                        console.log("Resource Not Found" + err);
                        res.send(404).send("Resource Not Found.");
                    } else {
                        if(vcfFlag == 1) {
                            entry.tracks.filter(function (track) {
                                if (track.group === "VCF") {
                                    items.forEach(function (current) {
                                        current.command = current.command.replace(/["']/g,"\\'");
                                        current.command = current.command.replace(/\\\\/g,"\\");
                                        track.trackChildren.push({
                                            "name": current.name,
                                            "description": current.command,
                                            "data": "Genoverse.Track.File.VCF.extend({\nname: '" + current.name + "',\ninfo: '" + current.command + "',\nmodel: Genoverse.Track.Model.File.VCF.extend({\nurl: '\<origin\>/index/request?chr=__CHR__&start=__START__&end=__END__&type=tabix',\nlargeFile: true,\nurlParams: {file: '" + current.route + "'}\n})\n})"
                                            //'data': 'Genoverse.Track.File.VCF.extend({\nname: "' + current.name + '",\ninfo: "' + current.command + '",\nmodel: Genoverse.Track.Model.File.VCF.extend({\nurl: "http://'+ip.address()+':'+process.env.PORT+'/index/request?chr=__CHR__&start=__START__&end=__END__&type=tabix",\nlargeFile: true,\nurlParams: {file: "' + current.route + '"}\n})\n})'
                                        })

                                    })

                                }
                            });
                        };
                        if(densityFlag == 1) {
                            entry.tracks.filter(function (track) {
                                if (track.group === "SNP Density") {
                                    items.forEach(function (current) {
                                        current.command = current.command.replace(/["']/g,"\\'");
                                        current.command = current.command.replace(/\\\\/g,"\\");
                                        track.trackChildren.push({
                                            "name": current.name,
                                            "description": current.command,
                                            "data": "Genoverse.Track.SNPDensity.extend({\nname: '" + current.name + "',\ninfo: '" + current.command + "',\nmodel: Genoverse.Track.Model.SNPDensity.extend({\nurl: '\<origin\>/index/request?chr=__CHR__&start=__START__&end=__END__&type=tabix',\nlargeFile: true,\nbinSize_id: '"+current.name+uuid()+"',\nurlParams: {file: '" + current.route + "'}\n})\n})"
                                            //'data': 'Genoverse.Track.SNPDensity.extend({\nname: "' + current.name + '",\ninfo: "' + current.command + '",\nmodel: Genoverse.Track.Model.SNPDensity.extend({\nurl: "http://'+ip.address()+':'+process.env.PORT+'/index/request?chr=__CHR__&start=__START__&end=__END__&type=tabix",\nlargeFile: true,\nurlParams: {file: "' + current.route + '"}\n})\n})'
                                        })

                                    })

                                }
                            });
                        };
                        entry.save(function (err) {
                            if (err) {
                                console.log("Error saving document: " + err);
                                res.status(500).send("Database Error.");
                            } else {
                                console.log('Instance modified !');
                                res.send('Success');
                            }
                        });
                    }
                })
            }
        })
    }


});

////Deletion Routes --------------------------------------------------------

//deletion route for deleting entries in the TSI database, and removing the associated query VCF files.
router.delete('/tersectUpload/:id',isTersectAuthenticated, function(req,res,next){
    let query = {_id:req.params.id};
    let childQuery = {parent_id:req.params.id};
    TersectIntegration.findOneAndDelete(query, function(err,entry){
        if (err){
            console.error('File Deletion Error: Cant Find Ref: ' + err);
            res.status(404).send("Resource Not Found.");
        } else {
            rimraf(entry.route,function(err){
                if(err){
                    console.error('File Deletion Error: Cant Delete File at: ' + entry.route + ', ' + err)
                    res.status(500).send("File Deletion Error.");
                } else {
                    TersectVCF.find(childQuery,function(err,entries){
                        if(err){
                            console.error("error with tersectVCF delete: " + err);
                            res.status(500).send("File Deletion Error.");
                        } else {
                            TersectVCF.deleteMany(childQuery,function(err){
                                if(err){
                                    console.error('TersectVCF deletion error: ' + err);
                                    res.status(500).send("File Deletion Error.");
                                } else {
                                    entries.forEach(function(current){
                                        rimraf(path.dirname(current.route), function(err){
                                            if(err){
                                                console.error('Error in /tersectUpload query VCF deletion: ' + err);
                                                res.status(500).send("File Deletion Error.");
                                            }
                                        })
                                    });
                                    res.send('success')}
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
            console.error('QueryVCF Deletion Error: Cant Find Ref: ' + err);
            res.status(404).send("Resource Not Found.");
        } else {
            rimraf(path.dirname(entry.route),function(err){
                if(err){
                    console.error('Error in /tersectQueries query VCF deletion: ' + err)
                    res.status(500).send("File Deletion Error.");
                } else {
                    res.send('success')
                }
            })
        }
    });


});

////Query Generation Routes --------------------------------------------------------

//threshold calculator - not necessary for a threshold of 100.
function thresholdCalculator(_threshold, sets){
    var threshold = parseInt(_threshold);
    console.log("SetJoined: "+JSON.stringify(sets));
    if(Number.isInteger(threshold) && threshold >= 1 && threshold <= 3){
        var subqueries = [];
        var combinations = _.combinations(sets, threshold);
        for(var combination of combinations){
            combination = "('" + combination.join("'&'") + "')";
            subqueries.push(combination);
        }
        var query = (subqueries.length > 0) ?  "&(" + subqueries.join("|") + ")" : "";
        return query
    } else {
        console.log("returning nothing...");
        return ""
    }
}

//add file path to tsi file to run
function tersect(params) {
    var query={_id:params.idToGet};
    var command = params.fullCommand;
    TersectIntegration.findOne(query, function(err,entry){
        if (err){
            console.error('Cant Find Ref: ' + err);
            res.status(404).send("Resource Not Found.");
        } else {
            var newPath = path.join(dir,"newVCF",params.instanceID,path.basename(entry.route,".tsi"),uuid());
            var filepath = path.join(newPath,params.file);
            fs.mkdir(newPath, { recursive: true }, (err) => {
                if (err){
                    console.error("Error in making tersect query directory: " + err);
                } else {
                    console.error("ID: " + params.idToGet);
                    console.error("Command: "+ params.fullCommand);
                    console.error("newPath: "+ newPath);
                    console.error("filepath: "+ filepath);
                    console.error("typeof: " + Array.isArray(params.setsTranslatedJoined));
                    console.log("Sets:"+ JSON.stringify(params.setsTranslatedJoined));
                    console.log("Threshold:"+ params.threshold);
                    console.log(entry.route);
                    var thresholdCommand = thresholdCalculator(params.threshold, params.setsTranslatedJoined);
                    command = command + thresholdCommand;
                    console.log("Final Command: "+command);
                    var tcommand = spawn('tersect', ['view', entry.route, command]);
                    tcommand.on("error", (err)=> {
                        if(err.message === "tersectError"){
                            console.log("Error generating new VCF");
                        }
                    });
                    var output = fs.createWriteStream(filepath);
                    tcommand.stdout.on('data', (data) => {
                        output.write(data);
                    });
                    tcommand.stderr.on('data', (data) => {
                        console.error(`tersect stderr: ${data}`);
                        tcommand.emit("error", new Error("tersectError"))
                    });
                    tcommand.on('exit', (code) => {
                        if (code !== 0) {
                            console.log(`tersect process exited with code ${code}`);
                        } else {
                            console.log('done!');
                            var bgzipcommand = spawn('bgzip',[filepath]);
                            bgzipcommand.on("error", (err) => {
                                if (err.message === "bgzip"){
                                    console.error("Bgzip failed with non zero exit code: " + err)
                                }
                            });
                            bgzipcommand.stderr.on('data', (data) => {
                                console.error(`bgzip stderr: ${data}`);
                                bgzipcommand.emit("error",  new Error("bgzip"))
                            });
                            bgzipcommand.on('exit', (code) => {
                                if (code !== 0) {
                                    console.log(`bgzip process exited with code ${code}`);
                                } else {
                                    var filePathForTabix = filepath+'.gz';
                                    var tabixcommand = spawn('tabix',[filePathForTabix]);
                                    tabixcommand.on("error", (err) => {
                                        if(err.message === "tabix"){
                                            console.error("tabix exited with non zero exit code: " + err)
                                        } else if (err.message === "database"){
                                            console.error("Encountered error saving query to database.")
                                        }
                                    });
                                    tabixcommand.stderr.on('data', (data) => {
                                        console.error(`tabix stderr: ${data}`);
                                        tabixcommand.emit("error", new Error("tabix"))
                                    });
                                    tabixcommand.on('close', (code) => {
                                        if (code !== 0) {
                                            console.log(`tabix process exited with code ${code}`);
                                        } else {
                                            var item = new TersectVCF({
                                                name: params.file,
                                                command:encodeURIComponent(params.fullCommandOrig),
                                                sets:params.setArray,
                                                instance_id: params.instanceID,
                                                parent_id:params.idToGet,
                                                route: filePathForTabix
                                            });
                                            item.save(function (err, item) {
                                                if (err) {
                                                    return console.error(err);
                                                    tabixcommand.emit("error", new Error("database"));
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
            });

        }
    })}

router.post('/tersectQueries/generate',function(req,res,next){
    if(!req.body.command || !req.body.instanceID || !req.body.idToGet || !req.body.filepath || !req.body.threshold){
        res.status(403).send("Malformed Request")
    } else {
        var query = {_id : req.body.idToGet};
        TersectIntegration.findOne(query,function(err,entry){
            if(err){
                console.error("Cant Find Index With that ID.");
                res.status(304).send("Bad Request.")
            } else{
                console.log(typeof req.body.setA);
                console.log(typeof req.body.setB);
                console.log(typeof req.body.setC);
                var setA = typeof req.body.setA == 'object' ? req.body.setA : [];
                var setB = typeof req.body.setB == 'object' ? req.body.setB : [];
                var setC = typeof req.body.setC == 'object' ? req.body.setC : [];
                console.log("TYPEOF SETA: "+typeof setA);
                console.log("TYPEOF SETB: "+typeof setB);
                console.log("TYPEOF SETC: "+typeof setC);
                var sets = {A:setA,B:setB,C:setC};
                console.log("sets: "+JSON.stringify(sets));
                var setArray = [setA.filter(Boolean),setB.filter(Boolean),setC.filter(Boolean)];
                var setsTranslated = {A:[],B:[],C:[]};
                for(let set of Object.keys(sets)){
                    console.log(typeof set);
                    sets[set].forEach((element)=>{
                        console.log("ELEMENT: " + element);
                        if(typeof element == 'object'){
                            element = element.join();
                            console.log("TARGET ELEMENT" + element);

                            entry.aliases.forEach(function(trans, orig) {
                                console.log("CURRENT KEY: " + orig);
                                if (orig.indexOf(element) !== -1 ){
                                    console.log("TARGET KEY" + orig);
                                    setsTranslated[set].push(trans)
                                }
                            });
                        } else {
                            // console.log("ELEMENT TYPE: " + typeof element);
                            // console.log("Alias Value: " +  entry.aliases.get(element));
                            setsTranslated[set].push(entry.aliases.get(element))
                        }
                    })
                }
                //console.log("SetsTranslated: "+JSON.stringify(setsTranslated));

                var setsTranslatedJoined = [...setsTranslated.A,...setsTranslated.B,...setsTranslated.C].filter(Boolean);


                var comm = req.body.command;
                var threshold = req.body.threshold;
                var mapObj = {
                    A:"u" +"('" + setsTranslated.A.join("','") + "')",
                    B:"u" +"('" + setsTranslated.B.join("','") + "')",
                    C:"u" +"('" + setsTranslated.C.join("','") + "')"
                };

                var fullCommand = comm.replace(/A|B|C/g, function(matched){
                    return mapObj[matched];
                });

                var mapObjOrig = {
                    A:"u" +"('" + sets.A.join("','").replace(/\[([^\[\]]*)\]/g,"($1)*") + "')",
                    B:"u" +"('" + sets.B.join("','").replace(/\[([^\[\]]*)\]/g,"($1)*") + "')",
                    C:"u" +"('" + sets.C.join("','").replace(/\[([^\[\]]*)\]/g,"($1)*") + "')"
                };

                var fullCommandOrig = comm.replace(/A|B|C/g, function(matched){
                    return mapObjOrig[matched];
                });

                var tersectParams = {};
                tersectParams.instanceID = req.body.instanceID;
                tersectParams.idToGet = req.body.idToGet;
                tersectParams.file = req.body.filepath.replace(/[^\d\w-_.]/g,"_");
                tersectParams.setsTranslatedJoined = setsTranslatedJoined;
                tersectParams.setArray = setArray;
                tersectParams.fullCommand = fullCommand;
                tersectParams.fullCommandOrig = fullCommandOrig;
                tersectParams.threshold = threshold;

                tersect(tersectParams);
                res.send({ "location": tersectParams.instanceID });
            }
        })

    }
});

////Query VCF Download Route ---------------------------------

router.post('/tersectQueries/:id/download', function(req, res, next){
    if (!req.params.id){
        res.status(403).send("Malformed Request.")
    } else {
        var query = {_id:req.params.id};
        console.error(req.params.id);
        TersectVCF.findOne(query,function(err,entry){
            if(err){
                console.error("Cant find file for download id.");
                res.status(404).send("Can't find selected resource.");
            }
            else {
                var file = entry.route;
                res.set('Content-Type', 'application/gzip');

                res.download(file);
            }
        })
    }

});


////Query VCF Edit Route ---------------------------------

router.post('/tersectQueries/:id/edit', function(req, res, next){
    if (!req.params.id){
        res.status(403).send("Malformed Request.")
    } else {
        var query = {_id:req.params.id};
        console.error(req.params.id);
        TersectVCF.findOne(query,function(err,entry){
            if(err){
                console.error("Cant find file for download id.");
                res.status(404).send("Can't find selected resource.");
            }
            else {
                res.send(entry.sets)
            }
        })
    }

});

////Query VCF Purge Route ---------------------------------
//Delete every query VCF file for the instance
router.delete('/delete-query-vcfs/:instanceID', isTersectAuthenticated, function(req, res, next){
    var flag = 0;
    var instanceID = req.params.instanceID;
    if (instanceID){
        instanceID = instanceID.replace(/[./]/g, "")
    }
    if(!instanceID) {
        res.status(403).send("Malformed Request.")
    } else {
        console.log("instanceID: "+ instanceID)
        var query = {instance_id:instanceID};
        TersectVCF.deleteMany(query, function(err){
            if(err){
                console.error("Error encountered purging instance query VCFs: "+err);
                if (!res.headersSent){res.status(404).send("Resource Not Found.")};
            }
        });
        if(fs.existsSync(path.join(dir,"newVCF",instanceID))){
            rimraf(path.join(dir,"newVCF",instanceID),function(err){
                if(err){
                    console.error('Error in /tersectQueries query VCF deletion: ' + err)
                    if (!res.headersSent){res.status(404).send("Resource Not Found.")};
                } else {
                    res.send('success')
                }
            })
        } else {
            console.error("Route Doesnt Exist.")
        }
        if(!res.headersSent){res.send("success")}
    }
});

module.exports = router;
