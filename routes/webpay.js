var express = require('express');
var router = express.Router();
var multiparty = require('connect-multiparty'),
    multipartyMiddleware = multiparty();
var printlab = require('../util/printlab');
var dom = require('xmldom').DOMParser;
var xpath = require('xpath');
var Client = require('node-rest-client').Client;
var signxml = require('../util/signxml');
var path = require('path');
var fs = require('fs');
var x509 = require('x509');
var orden = require('../models/orden.js');


router.use('/final', function(req, res, next) {

    console.log("webpay-final");

    var token_ws = req.body.token_ws;//req.param('token_ws');
    console.log("webpay-final | token_ws="+token_ws);

    if(typeof token_ws === "undefined"){
        console.log("Pago Anulado");
        console.log(req.body);
        var orderid = req.body.TBK_ORDEN_COMPRA;
        res.redirect("/#/imprimir/webpay-error/"+orderid);
    }else{

        orden.findOne({ token : token_ws}, function (err, doc){
            if(doc==null){
                res.redirect("/#/imprimir/webpay-error/sin-orden");
            }else{
                res.redirect("/#/imprimir/webpay-ok/"+doc._id);
            }
        });

    }


});

router.use('/return', function(req, res, next) {

    console.log("::RETURN-URL::");

    var token_ws = req.body.token_ws;//req.param('token_ws');
    console.log("token ws="+token_ws);

    signxml.setOpts("%tokenInput%",token_ws);

    orden.findOne({ token : token_ws}, function (err, objOrden){
        console.log("findOne")
        console.log(objOrden)
        if(objOrden==null){
            res.redirect("/#/imprimir/webpay-error/sin-orden");
        }else{

            var opts = signxml.getOpts();
            var getTransactionResult = signxml.parseXml("getTransactionResult",opts);
            var _xml = signxml.signXml(getTransactionResult);
            var id = res.id;

            var url = 'https://webpay3gint.transbank.cl/WSWebpayTransaction/cxf/WSWebpayService?wsdl';

            // direct way
            var client = new Client();

            var args = {
                data: _xml
            };

            console.log("webpay[getTransactionResult]");
            console.log(_xml);

            client.post(url, args, function (data, response) {
                // parsed response body as js object
                // raw response
                var _xml_data = data.toString();

                console.log("webpay-response[getTransactionResult]");
                console.log(_xml_data);

                if(!signxml.checkXml(_xml_data)){
                    console.log("webpay-response[getTransactionResult] | XML Firma invalida");
                    res.redirect("/#/imprimir/webpay-error/"+objOrden._id);
                }else{
                    console.log("webpay-response[getTransactionResult] | XML Firma valida");
                    var doc = new dom().parseFromString(_xml_data);

                    var select = xpath.useNamespaces(
                        {
                            "soap": "http://schemas.xmlsoap.org/soap/envelope/",
                            "ns2": "http://service.wswebpay.webpay.transbank.com/"
                        }
                    );
                    var accountingDate = select("//soap:Body//ns2:getTransactionResultResponse//return//accountingDate/text()", doc)[0].nodeValue,
                        buyOrder = select("//soap:Body//ns2:getTransactionResultResponse//return//buyOrder/text()", doc)[0].nodeValue,
                        cardNumber = select("//soap:Body//ns2:getTransactionResultResponse//return//cardDetail//cardNumber/text()", doc)[0].nodeValue,
                        detailOutput = select("//soap:Body//ns2:getTransactionResultResponse//return//detailOutput//sharesNumber/text()", doc)[0].nodeValue,
                        amount = select("//soap:Body//ns2:getTransactionResultResponse//return//detailOutput//amount/text()", doc)[0].nodeValue,
                        commerceCode = select("//soap:Body//ns2:getTransactionResultResponse//return//detailOutput//commerceCode/text()", doc)[0].nodeValue,
                        buyOrder = select("//soap:Body//ns2:getTransactionResultResponse//return//detailOutput//buyOrder/text()", doc)[0].nodeValue,
                        authorizationCode = select("//soap:Body//ns2:getTransactionResultResponse//return//detailOutput//authorizationCode/text()", doc)[0].nodeValue,
                        paymentTypeCode = select("//soap:Body//ns2:getTransactionResultResponse//return//detailOutput//paymentTypeCode/text()", doc)[0].nodeValue,
                        responseCode = select("//soap:Body//ns2:getTransactionResultResponse//return//detailOutput//responseCode/text()", doc)[0].nodeValue,
                        sessionId = select("//soap:Body//ns2:getTransactionResultResponse//return//sessionId/text()", doc)[0].nodeValue,
                        transactionDate = select("//soap:Body//ns2:getTransactionResultResponse//return//transactionDate/text()", doc)[0].nodeValue,
                        urlRedirection = select("//soap:Body//ns2:getTransactionResultResponse//return//urlRedirection/text()", doc)[0].nodeValue,
                        VCI = select("//soap:Body//ns2:getTransactionResultResponse//return//VCI/text()", doc)[0].nodeValue;

                     var transaccion = {
                        usuarioid : id,
                        accountingDate : accountingDate,
                        buyOrder : buyOrder,
                        cardNumber : cardNumber,
                        detailOutput : detailOutput,
                        amount : amount,
                        commerceCode : commerceCode,
                        buyOrder : buyOrder,
                        authorizationCode : authorizationCode,
                        paymentTypeCode : paymentTypeCode,
                        responseCode : responseCode,
                        sessionId : sessionId,
                        transactionDate : transactionDate,
                        trnsactionDateParse : Date.parse(transactionDate),
                        urlRedirection : urlRedirection,
                        VCI : VCI
                    }


                    objOrden.jsontbk = JSON.stringify(transaccion);
                    objOrden.save();


                    var opts = signxml.getOpts();
                    signxml.setOpts("%tokenInput%",token_ws);
                    var acknowledgeTransaction = signxml.parseXml("acknowledgeTransaction",opts);
                    var _xml_ack = signxml.signXml(acknowledgeTransaction);

                    var url = 'https://webpay3gint.transbank.cl/WSWebpayTransaction/cxf/WSWebpayService?wsdl';

                    // direct way
                    var client = new Client();

                    var args = {
                        data: _xml_ack
                    };

                    console.log("webpay[acknowledgeTransaction]");
                    console.log(_xml_ack);

                    client.post(url, args, function (data, response) {

                        // parsed response body as js object
                        // raw response
                        var _xml_data_ack = data.toString();

                        console.log("webpay-response[acknowledgeTransaction]");
                        console.log(_xml_data);

                        if(signxml.checkXml(_xml_data_ack)){
                            console.log("webpay-response[acknowledgeTransaction] | XML Firma valida");

                            if(responseCode==0){
                                objOrden.pagada = true;
                                objOrden.save();

                                res.render('formAutoSubmit',{_REDIRECT:urlRedirection,_TOKEN:token_ws});
                            }else{
                                res.redirect("/#/imprimir/webpay-error/"+buyOrder);
                            }


                        }else{
                            console.log("webpay-response[acknowledgeTransaction] | XML Firma invalida");
                            res.redirect("/#/imprimir/webpay-error/"+buyOrder);
                        }
                    });


                }

            });



        }
    });



});

router.use('/init',function(req,res,next){

    var orderid=req.body.orderid,
        total=req.body.total;

    //console.log("orderid="+orderid);
    //console.log("total="+total);

    orden.findById(orderid, function (err, objOrden){
        if(objOrden==null||objOrden.pagada==false){

            var id = res.id,
                _t = Date.now() / 1000 | 0,
                sessionId = id+"-"+_t;

            signxml.setOpts("%wSTransactionType%","TR_NORMAL_WS");
            signxml.setOpts("%commerceId%",597020000541);
            signxml.setOpts("%buyOrder%",orderid);
            signxml.setOpts("%sessionId%",sessionId);
            //signxml.setOpts("%returnURL%","http://10.0.0.102:3000/webpay/return");
            //signxml.setOpts("%finalURL%","http://10.0.0.102:3000/webpay/final");
            signxml.setOpts("%returnURL%","https://app-theprintlab.herokuapp.com/webpay/return");
            signxml.setOpts("%finalURL%","https://app-theprintlab.herokuapp.com/webpay/final");
            //
            signxml.setOpts("%amount%",total);
            signxml.setOpts("%commerceCode%","597020000541");

            var opts = signxml.getOpts();
            var initTransaction = signxml.parseXml("initTransaction",opts);
            var _xml = signxml.signXml(initTransaction);

            var url = 'https://webpay3gint.transbank.cl/WSWebpayTransaction/cxf/WSWebpayService?wsdl';

            var client = new Client();

            var args = {
                data: _xml
            };

            console.log("webpay[initTransaction]");
            console.log(_xml);

            client.post(url, args, function (data, response) {
                var _xml_data = data.toString();

                console.log("webpay-response[initTransaction]");
                console.log(_xml_data);

                if(!signxml.checkXml(_xml_data)){
                    console.log("webpay-response[initTransaction] | XML Firma invalida");
                    var out = {};
                    out.estado = "error";
                    out.mensaje = "Problemas de conexión con Transbank.";
                    //res.redirect("/#/imprimir/webpay-error");
                    res.json(out);
                }else{
                    console.log("webpay-response[initTransaction] | XML Firma valida");

                    var doc = new dom().parseFromString(_xml_data);

                    var select = xpath.useNamespaces(
                        {
                            "soap": "http://schemas.xmlsoap.org/soap/envelope/",
                            "ns2": "http://service.wswebpay.webpay.transbank.com/"
                        }
                    );

                    var out = {};

                    out.estado = "ok";
                    out.token = select("//soap:Body//ns2:initTransactionResponse//return//token/text()", doc)[0].nodeValue;
                    out.tbk_url = select("//soap:Body//ns2:initTransactionResponse//return//url/text()", doc)[0].nodeValue;


                    orden.findById(orderid, function (err, objOrden){
                        if(objOrden==null){
                            var objOrden = new orden();
                        }
                        objOrden._id = orderid;
                        objOrden.token = out.token;
                        objOrden.monto = total;
                        objOrden.save();
                        res.json(out);
                    });
                }

            });

        }else{
            console.log("webpay[initTransaction] | Orden ya existe | ordenid="+orderid);
            var out = {};
            out.estado = "duplicada";
            out.mensaje = "La orden "+orderid+" ya se encuentra procesada.";
            //res.redirect("/#/imprimir/webpay-error");
            res.json(out);
        }
    });

});

router.use('/json',function(req,res,next) {

    var order = req.body.order;

    orden.findById(order, function (err, doc){
        if(doc==null){
            res.send({});
        }else{
            //var _j = JSON.parse(doc);
            res.send(doc);
        }
    });
});

router.use('/test',function(req,res,next) {

    var tbkFolder = path.join(__dirname, '../tbk/');

    var _xml_data = fs.readFileSync(tbkFolder+'demoresponse.xml').toString();

    var a = signxml.checkXml(_xml_data);
    res.send(a);
});

module.exports = router;