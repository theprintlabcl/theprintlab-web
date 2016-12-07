var express = require('express');
var router = express.Router();
var multiparty = require('connect-multiparty'),
    multipartyMiddleware = multiparty();
var printlab = require('../util/printlab');
var localidad = require('../util/localidad');
var path = require('path');
var foto = require('../models/foto.js');
var orden = require('../models/orden.js');
var request = require('request');
var fs = require('fs');
var q = require('q');

/**
 * get /api/regiones
 * @uri /api/regiones
 * @return {json} regiones
 */
router.get('/regiones', function(req, res, next) {

    var regiones = localidad.getRegiones();
    res.send(regiones);

});

/**
 * get /api/provincias/:id
 * @uri /api/provincias/:id
 * @param {int} id - ID Region consultada
 * @return {json} provincias
 */
router.get('/provincias/:id', function(req, res, next) {

    var region = req.params.id;
    var provincias = localidad.getProvincias(region);
    res.send(provincias);

});


/**
 * get /api/comunas/:id
 * @uri /api/comunas/:id
 * @param {int} id - ID Provincia consultada
 * @return {json} comunas
 */
router.get('/comunas/:id', function(req, res, next) {

    var provincia = req.params.id;
    var comunas  = localidad.getComunas(provincia);
    res.send(comunas);

});

/**
 * obtiene informacion del usuario; si no existe el id consultado se creara un cliente nuevo
 * @uri /api/client
 * @param {int} id - ID Provincia consultada
 * @return {json} comunas
 */
router.get('/client', function(req, res, next) {

    var id = res.id;
    printlab.getClient(id).then(function(gr){
        var getClientError = JSON.parse(gr);

        switch(getClientError.error){
            case "ClientNotFound":

                printlab.registerClient(id).then(function(rr){
                    res.send(rr);
                },function(re){
                    res.send(re);
                });

                break;

            default:
                res.send(gr);
                break;
        }

    },function(ge){
        res.send(ge);
    });

});

/**
 * actualiza informacion del cliente
 * @uri /api/client
 * @param {string} id - Client ID
 * @param {string} email - Client email
 * @param {string} mobile - Client mobile
 * @return {json} Response API _updateClient Printlab
 */
router.post('/client', function(req, res, next) {

    var id = res.id,
        email = req.body.email || "",
        mobile = req.body.mobile || "";

    printlab.updateClient(id,email,mobile).then(function(ur){
        res.send(ur);
    },function(ue){
        res.send(ue);
    });

});

/**
 * registra direccion
 * @uri /api/addresses
 * @param {string} id - Client ID
 * @param {json} address - Client address
 * @return {json} Response API _registerAddress Printlab
 */
router.post('/addresses',function(req,res,next){

    var id = res.id,
        address = req.body.address;

    printlab.registerAddress(id,address).then(function(ra){
        res.send(ra);
    },function(err){
        res.send(err);
    });

});

/**
 * obtiene direccion consultada
 * @uri /api/addresses/:id
 * @param {string} id - Address ID
 * @return {json} Response API _getAddresses Printlab
 */
router.get('/addresses/:id',function(req,res,next){

    var id = req.params.id;

    printlab.getAddresses(id).then(function(ra){
        res.send(ra);
    },function(err){
        res.send(err);
    });

});

/**
 * elimina direccion
 * @uri /api/addresses/:id
 * @param {string} id - Address ID
 * @return {json} Response API _getAddresses Printlab
 */
router.delete('/addresses/:id',function(req,res,next){

    var id = req.params.id;

    printlab.removeAddresses(id).then(function(ra){
        res.send(ra);
    },function(err){
        res.send(err);
    });

});

/**
 * crea una orden
 * @uri /api/orders/create
 * @param {string} id - Client ID
 * @param {string} id - Address ID
 * @param {int} photo_count
 * @param {int} cost_printing
 * @param {int} cost_shipping
 * @param {int} cost_total
 * @param {bool} gift
 * @param {string} verbose
 * @param {string} coupon_code
 * @return {json} Response API _createOrder Printlab
 */
router.post('/orders/create',function(req,res,next){

    var id = res.id;
    var order = {
        client : id,
        address : req.body.address,
        photo_count : req.body.photo_count,
        cost_printing : req.body.cost_printing,
        cost_shipping : req.body.cost_shipping,
        cost_total : req.body.cost_total,
        gift : req.body.gift,
        verbose : req.body.verbose,
        coupon_code : req.body.coupon_code
    };

    printlab.createOrder(order).then(function(ra){
        res.send(ra);
    },function(err){
        res.send(err);
    });

});

/**
 * sube la imagenes a Google Storage; completa la orden;
 * -Si offline_payment == true llamara al metodo _submitOrder de Printlab
 * -Si offline_payment != true el proceso solo subira las imagenes a Google Storage, la orden se completara al momento de terminar la compra con webpay
 * @uri /api/orders/create
 * @param {string} id - Client ID
 * @param {string} id - Address ID
 * @param {int} photo_count
 * @param {int} cost_printing
 * @param {int} cost_shipping
 * @param {int} cost_total
 * @param {bool} gift
 * @param {string} verbose
 * @param {string} coupon_code
 * @return {json} Response API _createOrder Printlab
 */
router.post('/orders/submit',multipartyMiddleware,function(req,res,next){
    var order = req.body.order,
        infofiles = req.body.infofiles,
        offline_payment = req.body.offline_payment;

    if(typeof offline_payment == "string" && offline_payment == "true") offline_payment = true;
    if(typeof offline_payment == "string" && offline_payment == "false") offline_payment = false;


    //Crear en MongoDB para utilizar informacion en webpay/return
    if(!offline_payment){
        var objOrden = new orden();
        objOrden.offline_payment = true;
        objOrden._id = order;
        objOrden.save();
    }

    var upload_storage = function(_f){

        console.log("upload_storage",_f)

        var deferred = q.defer();

        var _ext = "";
        switch (_f.type) {
            case "image/png":
                _ext = ".png";
                break;
            case "image/gif":
                _ext = ".gif";
                break;
            case "image/jpeg":
            case "image/jpg":
                _ext = ".jpg";
                break;
            default:
                _ext = ".jpg";
                break;
        }

        var _name = _f.name,
            _imagen = _name+_ext;


        var gs_uri = process.env.URL_STORAGE+'o?uploadType=media&name='+_imagen+'&key='+process.env.KEY_STORAGE;

        request({
            method: 'POST',
            uri: gs_uri,
            headers: {
                'content-type': _f.type
            },
            body : fs.createReadStream( _f.path )

        },
        function (error, response, body) {
            if (error) {
                return console.error('upload failed:', error);
            }
            var json_body = JSON.parse(body);
            console.log('Upload successful! ' + json_body.name);

            var _obj_photo = [];
            _obj_photo["file_name"] = json_body.name;
            _obj_photo["qty"] = infofiles[_name];

            //Crear en MongoDB para utilizar informacion en webpay/return
            var objFoto = new foto();
            objFoto.order = order;
            objFoto.imagen = json_body.name;
            objFoto.qty = infofiles[_name];
            objFoto.save();

            deferred.resolve(_obj_photo);

        });

        return deferred.promise;

    }

    var _files = req.files.file;

    q.all(_files.map(upload_storage)).then(function(photos){

        if(offline_payment){

            console.log("array photos",photos);

            printlab.submitOrder(order,photos,true).then(function(rc){
                console.log("submitOrder",rc);
                res.send("OK");
            },function(err){
                res.send(err);
            });

        }else{
            res.send("OK");
        }
    })


});

/**
 * canjear cupon
 * @uri /api/coupons/redeem
 * @param {string} id - Client ID
 * @param {string} coupon_code
 * @return {json} Response API _redeemCoupon Printlab
 */
router.post('/coupons/redeem',function(req,res,next){

    var id = res.id;
    var coupon_code = req.body.coupon_code;

    printlab.redeemCoupon(id,coupon_code).then(function(rc){
        res.send(rc);
    },function(err){
        res.send(err);
    })
});

/**
 * lista los cupones del usuario
 * @uri /api/coupons/redeem
 * @param {string} id - Client ID
 * @return {json} Response API _getCoupon Printlab
 */
router.post('/coupons',function(req,res,next){

    var id = res.id;

    printlab.getCoupon(id).then(function(rc){
        res.send(rc);
    },function(err){
        res.send(err);
    })
});

module.exports = router;