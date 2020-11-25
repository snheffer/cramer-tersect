var mongoose = require("mongoose");

var fileSchema = new mongoose.Schema({
    name: {type: String, required: true},
    instance_id : {type: String, required: true},
    renamed: {type: Boolean, required: true},
    route: {type: String, required: true},
    samples: {type: Array, of: String},
    aliases: {type: Map, of: String}

});

module.exports = mongoose.model('tersectIntegration', fileSchema);
