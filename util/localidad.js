var regiones = require('../util/data/BDCUT_CL_Regiones.min.json');
var provinciaRegion = require('../util/data/BDCUT_CL_ProvinciaRegion.min.json');
var comunaProvincia = require('../util/data/BDCUT_CL_ComunaProvincia.min.json');

module.exports = {
    getRegiones : function(){
        return regiones;
    },

    getProvincias : function(regid){
        return provinciaRegion[regid];
    },

    getComunas : function(provid){
        return comunaProvincia[provid];
    }
}