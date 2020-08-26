var mongoose = require("mongoose");

var vcfSchema = new mongoose.Schema({
    name: {type: String, required: true},
    command: {type: String, required: true},
    sets: {type: Array, required: false},
    instance_id : {type: String, required: true},
    parent_id : {type: String, required: true},
    route: {type: String, required: true}

});

module.exports = mongoose.model('TersectVCF', vcfSchema);
