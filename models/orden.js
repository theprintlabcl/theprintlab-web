var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Orden = new Schema({
    _id : { type: String },
    pagada :  { type: Boolean, default: false },
    enviada : { type: Boolean, default: false },
    proceso : { type: Boolean, default: false },
    offline_payment : { type: Boolean, default: false },
    jsontbk : { type: String, default: "{}" }
});

module.exports = mongoose.model('orden', Orden);