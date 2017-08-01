require('dotenv').config();
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var Hashids = require("hashids");
var printlab = require('./util/printlab');
var mongoose = require('mongoose');

var api = require('./routes/api');
var webpay = require('./routes/webpay');

var app = express();

mongoose.connect(process.env.MONGODB_URI);



// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(function(req,res,next){

  //Config webpay
  if (app.get('env') === 'production') {
    //Webpay produccion
    res.locals.webpay = {
      "codigoComercio" : "597032243762",
      "urlSoap" : "https://webpay3g.transbank.cl/WSWebpayTransaction/cxf/WSWebpayService?wsdl"
    };
  }else{
    //Webpay desarrollo
    res.locals.webpay = {
      "codigoComercio" : "597020000541",
      "urlSoap" : "https://webpay3gint.transbank.cl/WSWebpayTransaction/cxf/WSWebpayService?wsdl"
    };
  }


  /*
  * Obtiene actual udid del usuario; de lo contrario registra nuevo usuario
  * */
  if (req.cookies.printlab_udid&&req.cookies.printlab_id) {
    var uid = req.cookies.printlab_udid;
    var id = req.cookies.printlab_id;
    res.udid = uid;
    res.id = id;
    next();
  }else {
    var d = new Date();
    var key = req.connection.remoteAddress + d.toLocaleTimeString();
    var hashids = new Hashids(key,32);
    var udid = hashids.encode(1);
    var expiresdate = new Date();
    var numberOfDaysToAdd = 365;
    expiresdate.setDate(expiresdate.getDate() + numberOfDaysToAdd);
    res.cookie('printlab_udid', udid, {expires: expiresdate});
    res.udid = udid;
    //Get ID User
    printlab.registerClient(udid).then(function(r){
      var _id = r.client._id;
          res.cookie('printlab_id', _id, {expires: expiresdate});
          res.id = id;
      next();
    }).catch(function(err){
      next(err);
    });
  }

});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', api);
app.use('/webpay', webpay);

//Print JADE Pretty
app.locals.pretty = true;


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  console.log("error",err);
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
