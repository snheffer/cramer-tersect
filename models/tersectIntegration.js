var mongoose = require("mongoose");

var fileSchema = new mongoose.Schema({
    name: {type: String, required: true},
    instance_id : {type: String, required: true},
    local: {type: Boolean, required: true},
    route: {type: String, required: true}

});

module.exports = mongoose.model('tersectIntegration', fileSchema);
