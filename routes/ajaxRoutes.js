var express = require('express');
var router = express.Router();
var util = require('util');
var path = require('path');
var formidable = require('formidable');
var rimraf = require('rimraf');
var rrAsync = util.promisify(rimraf);
var ip = require('ip');
var fs = require('fs');
var mkdirAsync = util.promisify(fs.mkdir);
var writeFileAsync = util.promisify(fs.writeFile);
var renameAsync = util.promisify(fs.rename);
var copyAsync = util.promisify(fs.copyFile);
require('lodash.combinations');
var _ = require('lodash');
var GenoverseInstance = require('../models/GenoverseInstance.js');
var TersectIntegration = require('../models/tersectIntegration.js');
var TersectVCF = require('../models/TersectVCF.js');
var utils = require('../routes/utils.js');
var { v4: uuid } = require('uuid');
const {spawn} = require('child_process');
const spawnAsync = require('await-spawn');
const {spawnSync} = require('child_process');

function formidablePromise (req, opts) {
    return new Promise(function (resolve, reject) {
        var form = new formidable.IncomingForm(opts)
        form.parse(req, function (err, fields, files) {
            if (err) return reject(err)
            resolve({ fields: fields, files: files })
        })
    })
}

class UserError extends Error {
    constructor(message, statusCode = 500) {
        super(message)
        this.name = 'UserError';
        this.statusCode = statusCode;
        Error.captureStackTrace(this, UserError)
    }
}

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

serialDeleter = function(){
    let args = Array.from(arguments);
    args = Array.prototype.concat.apply([], args);
    for(let path of args){
        rrAsync(path).then(console.log(`Deleted file located at: ${path}`)).catch((e)=>{
            console.error(`Error Encountered Deleting Path ${path}. ERROR: ${e}`)
        });
    }
};

isUploadAuthenticated = function (req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        req.destroy();
        res.status(403).send('You need to be logged in to complete that action.');
    }
};

isTersectAuthenticated = function (req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.status(403).send('You need to be logged in to complete that action.');
    }
};

////Uploader Routes --------------------------------------------------------

//route for uploading a new Tersect Index (TSI) file.
router.post('/tersectUpload/new',isUploadAuthenticated, async function(req,res,next){
    try{
        let uploadDir = path.join(dir,'indexes')
        let {fields,files} = await formidablePromise(req,{multiples:false,maxFileSize:5368709120,uploadDir:uploadDir});
        if (!(await GenoverseInstance.exists({_id:fields.instanceID}))){
            throw new UserError("Tersect Instance Does Not Exist.",404)
        }
        console.log(JSON.stringify(files));
        if (!(files["uploads[]"].name.match(/\.(TSI|tsi)$/i))) {
            res.status(400).send('Uploaded File Type is Not a Tersect Index.');
            throw new UserError("Uploaded File Type is Not a Tersect Index.",400)
        }
        let newPath = path.join(uploadDir,fields.instanceID);
        await mkdirAsync(newPath, {recursive: true});
        newPath = path.join(uploadDir,fields.instanceID,files["uploads[]"].name);
        newPath = path.join(uploadDir,fields.instanceID,(path.basename(newPath).replace(/\.[^/.]+$/, "")+"_"+uuid()+path.extname(newPath)));
        console.log(`newPath: ${newPath}`);
        await renameAsync(files["uploads[]"].path, newPath);
        var flag = false;
        var sampleCheck = spawnSync('tersect',["samples",newPath,"-m","'*'"],{shell:true});
        var sampleCheckOutput = sampleCheck.stdout;
        sampleCheckOutput = sampleCheckOutput.toString().trim().split('\n');
        console.log(sampleCheckOutput);
        // for (var name of sampleCheckOutput){
        //     if(name.endsWith("*")){
        //         flag = true;
        //         break
        //     }
        // }
        if(flag){
            serialDeleter(newPath);
            throw new UserError('Illegal Characters in Sample Names',400)
        };
        sampleCheckOutput.shift();
        var idTable = utils.arraysToDict(sampleCheckOutput,utils.idGen(sampleCheckOutput.length,"aaa"));
        var idTableText = "";
        for(var i in idTable){
            console.log(i);
            idTableText = idTableText + `${i}\t${idTable[i]}\n`
        }
        var idtableTextOutput = idTableText;
        await writeFileAsync(newPath+'.tsv', idtableTextOutput);
        console.log("Name File Wrote successfully");
        try {
            const bl = await spawnAsync("tersect", ["rename", newPath, "-n", newPath+'.tsv'], {shell:true, cwd: path.join(dir,"indexes")});
        } catch(error){
            console.error(`Code: ${error.code}; \n STDERR: ${error.stderr}; \n STDOUT: ${error.stdout};`);
            throw error
        }
        console.log("Tersect Rename Successful")
        var item = new TersectIntegration({
            name: files["uploads[]"].name,
            instance_id: fields.instanceID,
            renamed: true,
            route: newPath,
            aliases: idTable
        });
        try {
            await item.save();
            res.send("success");
            console.log("saved to DB!")
        } catch (e) {
            serialDeleter(newPath);
            throw e
        }
    } catch (e) {
        console.error(e);
        if (!res.headersSent){
            if(e instanceof UserError){
                res.status(e.statusCode).send(e.message)
            } else res.status(500).send('Internal Error Encountered. Check Server Logs.')
        }
    }

});

//uploader route for uploading new vcf files to generate new TSI files, and add them to the database.
router.post('/vcfUpload/new',isUploadAuthenticated, async function(req,res,next){
    try {
        let randomDirName = uuid();
        let newPath = path.join(dir, "vcf", randomDirName);
        console.log("making newPath directory...");
        await mkdirAsync(newPath, { recursive: true });
        console.log("made directory");
        // create an incoming form object
        let {fields, files} = await formidablePromise(req, {multiples:true,maxFileSize:5368709120,uploadDir:newPath});
        // specify that we want to allow the user to upload multiple files in a single request
        // store all uploads in the ../vcf/ directory in a random directory.
        // every time a file has been uploaded successfully,
        // rename it to it's original name
        for (var file of files["uploads[]"]){
            if(file.name.toLowerCase().endsWith(".vcf")){
                let replacementPath = path.join(newPath,path.basename(file.name)+'_'+uuid()+'.vcf');
                await renameAsync(file.path,replacementPath);
            } else if (file.name.toLowerCase().endsWith(".vcf.gz")){
                let replacementPath = path.join(newPath,path.basename(file.name)+'_'+uuid()+'.vcf.gz');
                await renameAsync(file.path,replacementPath);
            } else {
                serialDeleter(newPath);
                throw new UserError("Wrong File Extensions.",400)
            }
        }
        if (!(await GenoverseInstance.exists({_id:fields.instanceID}))){
            throw new UserError("Tersect Instance Does Not Exist.",404)
        }
        await mkdirAsync(path.join(dir,"indexes",fields.instanceID), { recursive: true });
        res.send('success');
        console.error("FIELDS: "+JSON.stringify(fields, null, 4));
        console.error("FILES: "+JSON.stringify(files, null, 4));
        fields.newName = fields.newName.replace(/[.,\/#!$%\^&\*;:{}=\-_`~() ]/g, "");
        const newIndexName =  fields.newName+"_"+uuid()+ ".tsi";
        try {
            const bl = await spawnAsync("tersect", ["build", newIndexName,path.join(dir,'vcf',randomDirName,'*')], {shell:true, cwd: path.join(dir,"indexes",fields.instanceID)});
        } catch(error){
            console.error(`Code: ${error.code}; \n STDERR: ${error.stderr}; \n STDOUT: ${error.stdout};`)
            throw error
        }
        var flag = false;
        var indexPath = path.join(dir, "indexes", fields.instanceID, newIndexName);
        console.log(`Index Path: ${indexPath}`);
        var sampleCheck = spawnSync('tersect',["samples",indexPath,"-m","'*'"],{shell:true});
        var sampleCheckOutput = sampleCheck.stdout;
        sampleCheckOutput = sampleCheckOutput.toString().trim().split('\n');
        console.log(sampleCheckOutput);
        // for (var name of sampleCheckOutput){
        //     if(name.endsWith("*")){
        //         flag = true;
        //         break
        //     }
        // }
        if(flag){
            serialDeleter(newPath,indexPath);
            throw new Error("Illegal Characters in Sample Names")
        };
        sampleCheckOutput.shift();
        var idTable = utils.arraysToDict(sampleCheckOutput,utils.idGen(sampleCheckOutput.length,"aaa"));
        var idTableText = "";
        for(var i in idTable){
            console.log(i)
            idTableText = idTableText + `${i}\t${idTable[i]}\n`
        }
        var idtableTextOutput = idTableText;
        await writeFileAsync(indexPath+'.tsv', idtableTextOutput);
        console.log("Name File Wrote successfully");
        try {
            const bl = await spawnAsync("tersect", ["rename", indexPath, "-n", indexPath+'.tsv'], {shell:true, cwd: path.join(dir,"indexes")});
            serialDeleter(newPath);
        } catch(error){
            console.error(`Code: ${error.code}; \n STDERR: ${error.stderr}; \n STDOUT: ${error.stdout};`)
            serialDeleter(newPath,indexPath);
            throw error
        }
        console.log("Tersect Rename Successful")
        var item = new TersectIntegration({
            name: fields.newName,
            instance_id: fields.instanceID,
            renamed: true,
            route: indexPath,
            aliases: idTable
        });
        try {
            await item.save();
            console.log("saved to DB!")
        } catch (e) {
            serialDeleter(newPath,indexPath);
            throw e
        }
    } catch (e) {
        console.error(e)
        if (!res.headersSent){
            if(e instanceof UserError){
                res.status(e.statusCode).send(e.message)
            } else res.status(500).send('Internal Error Encountered. Check Server Logs.')
        }
    }
});

//route for converting Index Keys back into original sample names, not advised but might be useful
//if the user wants to download the file with its original references.
////Translation Route --------------------------------------------------------

router.post('/tersectUpload/:id/translate', isTersectAuthenticated, async function(req,res,next){
    try {
        if (!req.params.id) {
            throw new UserError('Malformed Request', 400);
        }
        let query = {_id: req.params.id};
        let doc = await TersectIntegration.findOne(query);
        if (!doc) {
            throw new UserError('Cannot find file for download ID.', 404)
        }
        if (doc.renamed == false){
            throw new UserError('This ID is already using its original naming scheme.', 400)
        };
        let originalAliases =  Array.from(doc.aliases).reduce((originalAliases, [key, value]) => (
            Object.assign(originalAliases, { [key]: value })), {});
        let invertedAliases = _.invert(originalAliases);
        console.log("Inverted Aliases: " + invertedAliases )
        let newName = `${doc.name}_${uuid()}.tsi`;
        let indexPath = path.join(path.dirname(doc.route), newName);
        let idTableText = "";
        for(let i in invertedAliases){
            console.log(i)
            idTableText = idTableText + `${i}\t${invertedAliases[i]}\n`
        }
        let idtableTextOutput = idTableText;
        await copyAsync(doc.route, indexPath);
        await writeFileAsync(indexPath+'.tsv', idtableTextOutput);
        try {
            const bl = await spawnAsync("tersect", ["rename", indexPath, "-n", indexPath+'.tsv'], {shell:true, cwd: path.join(dir,"indexes")});
        } catch(error){
            console.error(`Code: ${error.code}; \n STDERR: ${error.stderr}; \n STDOUT: ${error.stdout};`)
            serialDeleter(indexPath);
            throw error
        }
        let item = new TersectIntegration({
            name: `${doc.name}_original`,
            instance_id: doc.instance_id,
            renamed: false,
            route: indexPath,
            samples: Object.values(invertedAliases)
        });
        try {
            await item.save();
            res.send('success')
            console.log("saved to DB!")
        } catch (e) {
            serialDeleter(indexPath);
            throw e
        }

    } catch (e) {
        console.error(e);
        if (!res.headersSent) {
            if (e instanceof UserError) {
                res.status(e.statusCode).send(e.message)
            } else res.status(500).send('Internal Error Encountered. Check Server Logs.')
        }
    }
});

////Populator Routes --------------------------------------------------------

//populator route for updating the list of TSI files on the server.
router.post('/tersectUpload', async function(req,res,next) {
    try{
        if(!(req.body.instanceID)){
            throw new UserError("No instanceID parameter specified.",400)
        }
        if (await GenoverseInstance.exists({_id: req.body.instanceID})){
            let items = await TersectIntegration.find({instance_id:req.body.instanceID});
            res.json(items)
        } else {
            throw new UserError("TersectIntegration instanceID doesn't exist.",404)
        }
    } catch (e) {
        console.error(e);
        if (!res.headersSent){
            if(e instanceof UserError){
                res.status(e.statusCode).send(e.message)
            } else res.status(500).send('Internal Error Encountered. Check Server Logs.')
        }
    }
});

//populator route for updating the queries associated with the specific index file.
router.post('/tersectQueries', async function(req,res,next) {
    try{
        if(!(req.body.idToGet)){
            throw new UserError("No ID parameter specified",400)
        }
        if (await TersectIntegration.exists({_id: req.body.idToGet})){
            let items = await TersectVCF.find({parent_id: req.body.idToGet});
            res.json(items)
        } else {
            throw new UserError("TersectIntegration ID doesn't exist.",404)
        }
    } catch (e) {
        console.error(e);
        if (!res.headersSent){
            if(e instanceof UserError){
                res.status(e.statusCode).send(e.message)
            } else res.status(500).send('Internal Error Encountered. Check Server Logs.')
        }
    }

});

//Route for populating sample list for the Venn GUI.
router.post('/tersectUpload/view', async function(req,res,next){
    try {
        if(!(req.body.tsifile)){
            res.status(400).send("No ID parameter specified",400)
        }
        let query = {_id:req.body.tsifile};
        let doc = await TersectIntegration.findOne(query);
        console.log(doc.name);
        if(doc.renamed == false){
            res.send({samples: doc.samples})
        } else if(doc.renamed == true) {
            let arr = [];
            for (let i of doc.aliases.keys()){
                arr.push(i)
            }
            res.send({ "samples": arr });

        }
    } catch (e) {
        console.error(e);
        if (!res.headersSent){
            if(e instanceof UserError){
                res.status(e.statusCode).send(e.message)
            } else res.status(500).send('Internal Error Encountered. Check Server Logs.')
        }
    }
});

//route for using generated query VCFs to generate new Tracks.
router.post('/tersectQueries/newTracks',isTersectAuthenticated, async function(req,res,next) {
    try{
        if(!req.body.instanceName|| !req.body.instanceID || !req.body.idsForTracks || !req.body.vcfFlag || !req.body.densityFlag){
            throw new UserError("Malformed Request.",400)
        }
        let vcfFlag = req.body.vcfFlag;
        let densityFlag = req.body.densityFlag;
        let vcfQuery = {_id:{$in:req.body.idsForTracks}};
        let instanceQuery = {_id:req.body.instanceID};
        let items = await TersectVCF.find(vcfQuery);
        if (!items)throw new Error('No VCFs Matching query.');
        let instance = await GenoverseInstance.findOne(instanceQuery);
        if (!instance) throw new Error('No Instance Matching query')
        if (vcfFlag == 1){
            instance.tracks.filter(function (track) {
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
        }
        if(densityFlag == 1) {
            instance.tracks.filter(function (track) {
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
        await instance.save();
        res.send('Success')
    } catch (e) {
        console.error(e);
        if (!res.headersSent){
            if(e instanceof UserError){
                res.status(e.statusCode).send(e.message)
            } else res.status(500).send('Internal Error Encountered. Check Server Logs.')
        }
    }
});

////Deletion Routes --------------------------------------------------------
router.delete('/tersectUpload/:id',isTersectAuthenticated, async function(req,res,next) {
    try{
        if(!req.params.id){
            throw new UserError("No TSI ID parameter specified.",400)
        }
        let query = {_id:req.params.id};
        let childQuery = {parent_id:req.params.id};
        let tersectEntry = await TersectIntegration.findOneAndDelete(query);
        if (tersectEntry){
            serialDeleter(tersectEntry.route);
        }
        let vcfEntries = await TersectVCF.find(childQuery);
        if (vcfEntries){
            vcfEntries.forEach(function(current){
                rrAsync(path.dirname(current.route)).catch(e => {
                    console.error(`${current.route} is not deletable. ERROR: ${e}`)
                })
            })
        }
        await TersectVCF.deleteMany(childQuery);
        res.send('success')
    } catch(e){
        console.error('Error in /tersectUpload query TSI deletion: ' + e);
        if (!res.headersSent){
            if(e instanceof UserError){
                res.status(e.statusCode).send(e.message)
            } else res.status(500).send('Internal Error Encountered. Check Server Logs.')
        }
    }
});

//deletion route for deleting entries in the QueryVCF database, and removing the files.
router.delete('/tersectQueries/:id',isTersectAuthenticated, async function(req,res,next){
    try {
        if(!req.params.id){
            throw new UserError("No VCF ID parameter specified.",400)
        }
        let query = {_id: req.params.id};
        let doc = await TersectVCF.findOneAndDelete(query);
        if (doc) {
            serialDeleter(path.dirname(doc.route));
            res.send('success')
        } else {
            console.error('QueryVCF Deletion Error: Cant Find Ref.');
            throw new UserError('Resource Not Found.',404);
        }
    } catch (e) {
        console.error('Error in /tersectQueries query VCF deletion: ' + e);
        if (!res.headersSent){
            if(e instanceof UserError){
                res.status(e.statusCode).send(e.message)
            } else res.status(500).send('Internal Error Encountered. Check Server Logs.')
        }
    }

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
            combination = "i('" + combination.join("','") + "')";
            subqueries.push(combination);
        }
        var query = (subqueries.length > 0) ?  "&(" + subqueries.join("|") + ")" : "";
        return query
    } else if(Number.isInteger(threshold) && threshold == 100) {
        let combination = "&(i('" + sets.join("','") + "'))"
        return combination
    } else {
        console.log("returning nothing...");
        return ""
    }
}

//add file path to tsi file to run
async function tersect(params) {
    try {
        let query = {_id: params.idToGet};
        let command = params.fullCommand;
        let doc = await TersectIntegration.findOne(query);
        let newPath = path.join(dir, "newVCF", params.instanceID, path.basename(doc.route, ".tsi"), uuid());
        let filepath = path.join(newPath, params.file);
        try {
            await mkdirAsync(newPath, {recursive: true});
        } catch (e) {
            throw new UserError(`Cannot Generate New Directory for query VCF: ${e}`);
        }
        console.error("ID: " + params.idToGet);
        console.error("Command: " + params.fullCommand);
        console.error("newPath: " + newPath);
        console.error("filepath: " + filepath);
        // console.error("typeof: " + Array.isArray(params.setsTranslatedJoined));
        // console.log("Sets:" + JSON.stringify(params.setsTranslatedJoined));
        console.log("Threshold:" + params.threshold);
        console.log(doc.route);

        let thresholdCommand = (doc.renamed) ? thresholdCalculator(params.threshold, params.setsTranslatedJoined) : thresholdCalculator(params.threshold, params.setsJoined);
        command = "("+ command+ ")" + thresholdCommand;
        console.log("Final Command: " + command);
        let tcommand = spawn('tersect', ['view', doc.route, command]);
        await new Promise((resolve, reject) => {
            let output = fs.createWriteStream(filepath);
            if(params.fullCommandOrig){
                output.write(`##fileformat=VCFv4.3\n##OriginalTersectCommand=${params.fullCommandOrig}\n`)
            }
            tcommand.on("error", (err) => {
                reject(err)
            });
            tcommand.stdout.on('data', (data) => {
                output.write(data);
            });
            tcommand.stderr.on('data', (data) => {
                console.error(`tersect stderr: ${data}`);
                tcommand.emit("error", new UserError("An error occurred in Tersect Query VCF generation"))
            });
            tcommand.on('exit', (code) => {
                if (code !== 0) {
                    console.log(`Tersect process exited with code ${code}`);
                    tcommand.emit("error", new UserError(`Tersect Exited with Error Code: ${code}`))
                } else {
                    console.log("TERSECT COMMAND COMPLETED SUCCESSFULLY " + filepath);
                    resolve()
                }
            })
        });
        let bgzipcommand = spawn('bgzip',[filepath]);
        await new Promise((resolve,reject)=>{
            bgzipcommand.on("error", (err) => {
                reject(err)
            });
            bgzipcommand.stderr.on('data', (data) => {
                console.error(`bgzip stderr: ${data}`);
                bgzipcommand.emit("error",  new UserError("Error Occurred in bgzip Process"))
            });
            bgzipcommand.on('exit', (code) => {
                if (code !== 0) {
                    console.log(`bgzip process exited with code ${code}`);
                    bgzipcommand.emit("error", new UserError(`Tersect Exited with Error Code: ${code}`))
                } else {
                    console.log("BGZIP COMMAND COMPLETED SUCCESSFULLY");
                    resolve()
                }
            })
        });
        let filePathForTabix = filepath+'.gz';
        let tabixcommand = spawn('tabix',[filePathForTabix]);
        await new Promise((resolve,reject)=>{
            tabixcommand.on("error", (err) => {
                reject(err)
            });
            tabixcommand.stderr.on('data', (data) => {
                console.error(`tabix stderr: ${data}`);
                tabixcommand.emit("error", new UserError("Error Occurred in Tabix Process"))
            });
            tabixcommand.on('close', (code) => {
                if (code !== 0) {
                    console.log(`tabix process exited with code ${code}`);
                    tabixcommand.emit("error", new UserError(`Tersect Exited with Error Code: ${code}`))
                } else {
                    console.log("TABIX COMMAND COMPLETED SUCCESSFULLY");
                    resolve()
                }
            })
        });
        var item = new TersectVCF({
            name: params.file,
            command: (doc.renamed) ? encodeURIComponent(params.fullCommandOrig) : encodeURIComponent(params.fullCommand),
            sets:params.setArray,
            instance_id: params.instanceID,
            parent_id:params.idToGet,
            route: filePathForTabix
        });
        try{
            await item.save()
            console.error("Query VCF added to TersectVCF");
        } catch (e) {
            console.error("Error Saving Query VCF To Database")
        }
    } catch (e) {
        throw e
    }
}

router.post('/tersectQueries/generate', async function(req,res,next){
    try{
        if(!req.body.command || !req.body.instanceID || !req.body.idToGet || !req.body.filepath || !req.body.threshold){
            throw new UserError('Malformed Request',403)
        }
        let query = {_id : req.body.idToGet};
        let doc = await TersectIntegration.findOne(query);
        console.log(typeof req.body.setA);
        console.log(typeof req.body.setB);
        console.log(typeof req.body.setC);
        let setA = typeof req.body.setA == 'object' ? req.body.setA : [];
        let setB = typeof req.body.setB == 'object' ? req.body.setB : [];
        let setC = typeof req.body.setC == 'object' ? req.body.setC : [];
        console.log("TYPEOF SETA: "+typeof setA);
        console.log("TYPEOF SETB: "+typeof setB);
        console.log("TYPEOF SETC: "+typeof setC);
        let sets = {A:setA,B:setB,C:setC};
        console.log("sets: "+JSON.stringify(sets));
        let setArray = [setA.filter(Boolean),setB.filter(Boolean),setC.filter(Boolean)];
        let tersectParams = {};
        if (doc.renamed == true){
            let setsTranslated = {A:[],B:[],C:[]};
            for(let set of Object.keys(sets)){
                console.log(typeof set);
                sets[set].forEach((element)=>{
                    console.log("ELEMENT: " + element);
                    if(typeof element == 'object'){
                        element = element.join();
                        console.log("TARGET ELEMENT: " + element);
                        doc.aliases.forEach(function(trans, orig) {
                            console.log("CURRENT KEY: " + orig);
                            if (orig.indexOf(element) == 0 ){
                                console.log("TARGET KEY" + orig);
                                setsTranslated[set].push(trans)
                            }
                        });
                    } else {
                        // console.log("ELEMENT TYPE: " + typeof element);
                        // console.log("Alias Value: " +  entry.aliases.get(element));
                        setsTranslated[set].push(doc.aliases.get(element))
                    }
                })
            };
            let setsTranslatedJoined = [...setsTranslated.A,...setsTranslated.B,...setsTranslated.C].filter(Boolean);
            let comm = req.body.command;
            let threshold = req.body.threshold;
            let mapObj = {
                A:"u" +"('" + setsTranslated.A.join("','") + "')",
                B:"u" +"('" + setsTranslated.B.join("','") + "')",
                C:"u" +"('" + setsTranslated.C.join("','") + "')"
            };
            let fullCommand = comm.replace(/A|B|C/g, function(matched){
                return mapObj[matched];
            });
            let mapObjOrig = {
                A:"u" +"('" + sets.A.map(function(x){
                    if(typeof x == 'object'){
                        return `(${x[0]})*`
                    } else {
                        return x
                    }
                }).join("','") + "')",
                B:"u" +"('" + sets.B.map(function(x){
                    if(typeof x == 'object'){
                        return `(${x[0]})*`
                    } else {
                        return x
                    }
                }).join("','") + "')",
                C:"u" +"('" + sets.C.map(function(x){
                    if(typeof x == 'object'){
                        return `(${x[0]})*`
                    } else {
                        return x
                    }
                }).join("','") + "')"
            };
            let fullCommandOrig = comm.replace(/A|B|C/g, function(matched){
                return mapObjOrig[matched];
            });
            tersectParams.instanceID = req.body.instanceID;
            tersectParams.idToGet = req.body.idToGet;
            tersectParams.renamed = true;
            tersectParams.file = req.body.filepath.replace(/[^\d\w-_.]/g,"_");
            tersectParams.setArray = setArray;
            tersectParams.fullCommand = fullCommand;
            tersectParams.fullCommandOrig = fullCommandOrig;
            tersectParams.threshold = threshold;
            tersectParams.setsTranslatedJoined = setsTranslatedJoined;

        } else {
            let setsJoined = [];
            for(let set of Object.keys(sets)){
                for( let i = 0; i < sets[set].length; i++){
                    if(typeof sets[set][i] == 'object'){
                        sets[set][i] = sets[set][i].join();
                        console.log("TARGET ELEMENT: " + sets[set][i]);
                        doc.samples.forEach(function(sample) {
                            console.log("CURRENT KEY: " + sample);
                            if (sample.indexOf(sets[set][i]) == 0 ){
                                console.log("TARGET KEY" + sample);
                                setsJoined.push(sample)
                            }
                        });
                        sets[set][i] = sets[set][i] + "*"
                    } else {
                        setsJoined.push(sets[set][i])
                    }
                }
            }
            let comm = req.body.command;
            let threshold = req.body.threshold;
            let mapObj = {
                A:"u" +"('" + sets.A.join("','") + "')",
                B:"u" +"('" + sets.B.join("','") + "')",
                C:"u" +"('" + sets.C.join("','") + "')"
            };
            let fullCommand = comm.replace(/A|B|C/g, function(matched){
                return mapObj[matched];
            });
            tersectParams.instanceID = req.body.instanceID;
            tersectParams.idToGet = req.body.idToGet;
            tersectParams.renamed = false;
            tersectParams.file = req.body.filepath.replace(/[^\d\w-_.]/g,"_");
            tersectParams.setArray = setArray;
            tersectParams.fullCommand = fullCommand;
            tersectParams.threshold = threshold;
            tersectParams.setsJoined = setsJoined;

        }



        res.send({ "location": tersectParams.instanceID });
        await tersect(tersectParams);

    } catch (e) {
        console.error('Error in /tersectQueries query VCF generation: ' + e);
        console.error(e);
        if (!res.headersSent){
            if(e instanceof UserError){
                res.status(e.statusCode).send(e.message)
            } else res.status(500).send('Internal Error Encountered. Check Server Logs.')
        }
    }
});

////Tersect Index Download Route --------------------------------

router.post('/tersectUpload/:id/download', async function (req, res, next){
    try {
        if (!req.params.id) {
            throw new UserError('Malformed Request', 400);
        }
        let query = {_id: req.params.id};
        let doc = await TersectIntegration.findOne(query);
        if (!doc) {
            throw new UserError('Cannot find file for download ID.', 404)
        }
        let file = doc.route;
        res.download(file);


    } catch (e) {
        console.error(e);
        if (!res.headersSent) {
            if (e instanceof UserError) {
                res.status(e.statusCode).send(e.message)
            } else res.status(500).send('Internal Error Encountered. Check Server Logs.')
        }
    }
});

////Query VCF Download Route ---------------------------------

router.post('/tersectQueries/:id/download', async function(req, res, next) {
    try {
        if (!req.params.id) {
            throw new UserError('Malformed Request', 400);
        }
        let query = {_id: req.params.id};
        let doc = await TersectVCF.findOne(query);
        if (!doc) {
            throw new UserError('Cannot find file for download ID.', 404)
        }
        let file = doc.route;
        res.download(file);
    } catch (e) {
        console.error(e);
        if (!res.headersSent) {
            if (e instanceof UserError) {
                res.status(e.statusCode).send(e.message)
            } else res.status(500).send('Internal Error Encountered. Check Server Logs.')
        }
    }
});

////Query VCF Edit Route ---------------------------------

router.post('/tersectQueries/:id/edit', async function(req, res, next){
    try {
        if(!req.params.id){
            throw new UserError('Malformed Request',400);
        }
        console.error(req.params.id);
        let query = {_id:req.params.id};
        let doc = await TersectVCF.findOne(query);
        if (!doc){
            throw new UserError('Cannot find resource for ID.',404)
        }
        res.send(doc.sets)
    } catch (e) {
        console.error(e)
        if (!res.headersSent) {
            if (e instanceof UserError) {
                res.status(e.statusCode).send(e.message)
            } else res.status(500).send('Internal Error Encountered. Check Server Logs.')
        }
    }
});

////Query VCF Purge Route ---------------------------------
//Delete every query VCF file for the instance
router.delete('/delete-query-vcfs/:instanceID', isTersectAuthenticated, async function(req, res, next){
    try{
        if(!req.params.instanceID){
            throw new UserError('Malformed Request',400)
        }
        var instanceID = req.params.instanceID;
        if(!(await GenoverseInstance.exists({_id: instanceID}))){
            throw new UserError('Instance Does Not Exist', 404)
        }
        console.log("instanceID: "+ instanceID);
        await TersectVCF.deleteMany({instance_id:instanceID});
        serialDeleter(path.join(dir,"newVCF",instanceID));
        res.send('success')
    } catch (e) {
        console.error(e)
        if (!res.headersSent) {
            if (e instanceof UserError) {
                res.status(e.statusCode).send(e.message)
            } else res.status(500).send('Internal Error Encountered. Check Server Logs.')
        }
    }
});
module.exports = router;
