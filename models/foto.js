var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Foto = new Schema({
    order : { type: String },
    imagen : { type: String },
    qty : { type: Number }
});

module.exports = mongoose.model('foto', Foto);