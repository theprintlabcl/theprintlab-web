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
    console.log(req.body);
    res.redirect("/#/imprimir/webpay-error");

});

router.use('/return', function(req, res, next) {

    console.log("::RETURN-URL::");

    var token_ws = req.body.token_ws;//req.param('token_ws');
    console.log("token ws="+token_ws);

    signxml.setOpts("%tokenInput%",token_ws);

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
            console.log("webpay-response[getTransactionResult] | XML Fima invalida");
            res.redirect("/#/imprimir/webpay-error");
        }else{
            console.log("webpay-response[getTransactionResult] | XML Fima valida");
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

            /*console.log("accountingDate : " + accountingDate);
            console.log("buyOrder : " + buyOrder);
            console.log("cardNumber : " + cardNumber);
            console.log("detailOutput : " + detailOutput);
            console.log("amount : " + amount);
            console.log("commerceCode : " + commerceCode);
            console.log("buyOrder : " + buyOrder);
            console.log("authorizationCode : " + authorizationCode);
            console.log("paymentTypeCode : " + paymentTypeCode);
            console.log("responseCode : " + responseCode);
            console.log("sessionId : " + sessionId);
            console.log("transactionDate : " + transactionDate);
            console.log("urlRedirection : " + urlRedirection);
            console.log("VCI : " + VCI);*/

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



            var objOrden = new orden();
            objOrden._id = buyOrder;
            objOrden.jsontbk = JSON.stringify(transaccion);
            objOrden.save();

            /*var webpayTrxFolder = path.join(__dirname, '../webpaytrx/'),
                currentTime = new Date(),
                month = currentTime.getMonth() + 1,
                year = currentTime.getFullYear(),
                rutaArchivo = webpayTrxFolder+year+"/"+month+"/",
                rutaJson = rutaArchivo+buyOrder+".json";

            fse.mkdirsSync(rutaArchivo)
            fse.writeJsonSync(rutaJson, transaccion);*/




            if(responseCode==0){

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
                        console.log("webpay-response[acknowledgeTransaction] | XML Fima valida");
                        objOrden.pagada = true;
                        objOrden.save();
                        res.redirect("/#/imprimir/webpay-ok/"+buyOrder);
                    }else{
                        console.log("webpay-response[acknowledgeTransaction] | XML Fima invalida");
                        res.redirect("/#/imprimir/webpay-error");
                    }
                });

            }else{
                res.redirect("/#/imprimir/webpay-error");
            }
        }

    });

});

router.use('/init',function(req,res,next){

    var orderid=req.body.orderid,
        total=req.body.total;

    //console.log("orderid="+orderid);
    //console.log("total="+total);

    var id = res.id,
        _t = Date.now() / 1000 | 0,
        sessionId = id+"-"+_t;

    signxml.setOpts("%wSTransactionType%","TR_NORMAL_WS");
    signxml.setOpts("%commerceId%",597020000541);
    signxml.setOpts("%buyOrder%",orderid);
    signxml.setOpts("%sessionId%",sessionId);
    signxml.setOpts("%returnURL%","https://app-theprintlab.herokuapp.com/webpay/return");
    signxml.setOpts("%finalURL%","https://app-theprintlab.herokuapp.com/webpay/final");
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
            console.log("webpay-response[initTransaction] | XML Fima invalida");
            res.redirect("/#/imprimir/webpay-error");
        }
        console.log("webpay-response[initTransaction] | XML Fima valida");

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

router.use('/json',function(req,res,next) {

    var order = req.body.order;

    orden.findById(order, function (err, doc){
        if(doc==null){
            res.send({});
        }else{
            var _j = JSON.parse(doc.jsontbk);
            res.send(_j);
        }
    });
});

module.exports = router;