var mongoose = require('mongoose');
var dotenv = require("dotenv");
dotenv.config();
var track = new mongoose.Schema({
    name: {type: String},
    description: {type: String},
    data: {type: String}
});

////
// Server middleware didnt work satisfactorily when instances were edited, as URLs were overwritten.
////
// track.pre('init', function (doc) {
//     console.error("Track INIT hook called");
//     // Failures with this middleware will result in a 500 server error, without crashing the system.
//     doc.data = doc.data.replace(/<protocol>/g,process.env.FILESERVERPROTOCOL);
//     doc.data = doc.data.replace(/<address>/g,process.env.FILESERVERIP)
// });

var trackSchema = new mongoose.Schema({
    group: {type: String, required: true},
    checked: Boolean,
    trackChildren: [track]
});

var pluginSchema = new mongoose.Schema({
    "name": {type: String, required: true},
    "checked": Boolean,
    "id": {type: String, required: true},
    "info": {type: String, required: true}
});

var genomeSchema = new mongoose.Schema({
    name: {type: String, required: true},
    type: {type: String, required: true}
});

var GenoverseSchema = new mongoose.Schema({
    name: {type: String, required: true, index: {unique: true}},
    description: {type: String, required: true},
    genome: genomeSchema,
    chr: {type: String, required: true},
    start: {type: String, required: true},
    end: {type: String, required: true},
    plugins: [pluginSchema],
    tracks: [trackSchema]
});

module.exports = mongoose.model('GenoverseInstance', GenoverseSchema);

