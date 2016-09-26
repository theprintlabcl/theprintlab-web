var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Orden = new Schema({
    _id : { type: String },
    pagada :  { type: Boolean, default: false },
    enviada : { type: Boolean, default: false },
    proceso : { type: Boolean, default: false },
    monto : { type: String },
    offline_payment : { type: Boolean, default: false },
    token : { type: String, default: ""},
    jsontbk : { type: String, default: "{}" }
});

module.exports = mongoose.model('orden', Orden);