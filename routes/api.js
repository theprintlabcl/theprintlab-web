var express = require('express');
var router = express.Router();
var multiparty = require('connect-multiparty'),
    multipartyMiddleware = multiparty();
var printlab = require('../util/printlab');
var localidad = require('../util/localidad');
var dom = require('xmldom').DOMParser;
var xpath = require('xpath');
var Client = require('node-rest-client').Client;
var signxml = require('../util/signxml');
var fse = require('fs-extra');
var path = require('path');
var foto = require('../models/foto.js');
var orden = require('../models/orden.js');

router.get('/regiones', function(req, res, next) {

    var regiones = localidad.getRegiones();
    res.send(regiones);

});

router.get('/provincias/:id', function(req, res, next) {

    var region = req.params.id;
    var provincias = localidad.getProvincias(region);
    res.send(provincias);

});

router.get('/comunas/:id', function(req, res, next) {

    var provincia = req.params.id;
    var comunas  = localidad.getComunas(provincia);
    res.send(comunas);

});


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

router.post('/client', function(req, res, next) {

    var id = res.id,
        email = req.body.email || "",
        mobile = req.body.mobile = "";

    printlab.updateClient(id,email,mobile).then(function(ur){
        res.send(ur);
    },function(ue){
        res.send(ue);
    });

});

router.post('/addresses',function(req,res,next){

    var id = res.id,
        address = req.body.address;

    printlab.registerAddress(id,address).then(function(ra){
        res.send(ra);
    },function(err){
        res.send(err);
    });

});

router.get('/addresses/:id',function(req,res,next){

    var id = req.params.id;;

    printlab.getAddresses(id).then(function(ra){
        res.send(ra);
    },function(err){
        res.send(err);
    });

});

router.delete('/addresses/:id',function(req,res,next){

    var id = req.params.id;

    printlab.removeAddresses(id).then(function(ra){
        res.send(ra);
    },function(err){
        res.send(err);
    });

});

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

router.post('/orders/submit',multipartyMiddleware,function(req,res,next){
    var order = req.body.order,
        infofiles = req.body.infofiles,
        offline_payment = req.body.offline_payment;

    var ordersFolder = path.join(__dirname, '../orders/'),
        myOrderFolder = ordersFolder+order+"/";

    if(!offline_payment){
        var objOrden = new orden();
        objOrden.offline_payment = true;
        objOrden._id = order;
        objOrden.save();
    }

    fse.mkdirsSync(myOrderFolder);

    for(var _f in req.files.file){

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

        var _filetemp = req.files.file[_f],
            _name = _filetemp.name,
            _imagen = myOrderFolder+_name+_ext;
        fse.move(_filetemp.path, _imagen, function (err) {
            if (err) return console.error(err)

            var objFoto = new foto();
            objFoto.order = order;
            objFoto.imagen = _name+_ext;
            objFoto.qty = infofiles[_name];
            objFoto.save();
        })
    }

    res.send("OK");
});

router.post('/coupons/redeem',function(req,res,next){

    var id = res.id;
    var coupon_code = req.body.coupon_code;

    printlab.redeemCoupon(id,coupon_code).then(function(rc){
        res.send(rc);
    },function(err){
        res.send(err);
    })
});

router.post('/coupons',function(req,res,next){

    var id = res.id;

    printlab.getCoupon(id).then(function(rc){
        res.send(rc);
    },function(err){
        res.send(err);
    })
});

/*

    WEBPAY

 */

router.use('/webpay',function(req,res,next){

    var orderid=req.body.orderid,
        total=req.body.total;

    console.log("orderid="+orderid);
    console.log("total="+total);

    signxml.setOpts("%wSTransactionType%","TR_NORMAL_WS");
    signxml.setOpts("%commerceId%",597020000541);
    signxml.setOpts("%buyOrder%","1001");
    signxml.setOpts("%sessionId%","11111111111");
    signxml.setOpts("%returnURL%","http://200.30.243.66:3000/webpay/return");
    signxml.setOpts("%finalURL%","http://200.30.243.66:3000/webpay/final");
    signxml.setOpts("%amount%","1990");
    signxml.setOpts("%commerceCode%","597020000541");

    var opts = signxml.getOpts();
    var initTransaction = signxml.parseXml("initTransaction",opts);
    var _xml = signxml.signXml(initTransaction);

    var url = 'https://webpay3gint.transbank.cl/WSWebpayTransaction/cxf/WSWebpayService?wsdl';

    var client = new Client();

    var args = {
        data: _xml
    };

    client.post(url, args, function (data, response) {
        var _xml_data = data.toString();

        //signxml.checkXml(_xml_data);

        var doc = new dom().parseFromString(_xml_data);

        var select = xpath.useNamespaces(
            {
                "soap": "http://schemas.xmlsoap.org/soap/envelope/",
                "ns2": "http://service.wswebpay.webpay.transbank.com/"
            }
        );

        var out = {};

        out.token = select("//soap:Body//ns2:initTransactionResponse//return//token/text()", doc)[0].nodeValue;
        out.tbk_url = select("//soap:Body//ns2:initTransactionResponse//return//url/text()", doc)[0].nodeValue;

        res.json(out);

    });

});

module.exports = router;