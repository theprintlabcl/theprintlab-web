var request = require('request');
var q = require('q');

module.exports = {

    config : {
        //URL Api
        _apiUrl : process.env.API_URL,
        _apiUser : process.env.API_USER,
        _apiPassword : process.env.API_PASSWORD,
        //Methods
        _getClient : '/v2/clients/{CLIENT_ID}',
        _registerClient : '/v2/clients',
        _updateClient : '/v2/clients/{CLIENT_ID}',
        _registerAddress : '/v2/clients/{CLIENT_ID}/addresses',
        _getAddresses : '/v2/addresses/{ADDRESS_ID}',
        _removeAddresses : '/v2/addresses/{ADDRESS_ID}',
        _createOrder : '/v1/orders/create',
        _submitOrder : '/v1/orders/submit',
        _cancelOrder : '/v2/orders/{ORDER_ID}/cancel',
        _getCoupon : '/v2/clients/{CLIENT_ID}/coupons',
        _redeemCoupon : '/v1/coupons/redeem',
        _ordersPayment : '/v1/orders/payment/{ORDER_ID}/{ACTION}'
    },

    apiGet : function(uri){
        var deferred = q.defer();
        console.log("GET ["+uri+"]");

        try{
            request({url: uri}, function (error, response, body) {
                console.log("response "+uri,body);
                if(error){
                    throw new Error(error);
                }
                deferred.resolve(body);
            });
        }catch (error) {
            deferred.reject(error);
        }

        return deferred.promise;
    },

    apiPost : function(uri,data,auth){
        var deferred = q.defer(),
            data = data || {},
            auth = auth || null;
        console.log("POST ["+uri+"]");
        console.log("--DATA--");
        console.log(data);
        console.log("--/DATA--");
        try{
            request.post({url:uri, form:data, auth:auth}, function (error, response, body) {
                console.log("response "+uri,body);
                if(error){
                    throw new Error(error);
                }
                deferred.resolve(body);
            });
        }catch (error) {
            deferred.reject(error);
        }

        return deferred.promise;
    },

    apiPostJson : function(uri,data,auth){
        var deferred = q.defer(),
            data = data || {},
            auth = auth || null;
        console.log("POST ["+uri+"]");
        console.log("--DATA--");
        console.log(data);
        console.log("--/DATA--");
        try{
            request.post({url:uri, json:data, auth:auth}, function (error, response, body) {
                if(error){
                    throw new Error(error);
                }
                deferred.resolve(body);
            });
        }catch (error) {
            deferred.reject(error);
        }

        return deferred.promise;
    },

    apiDelete : function(uri){
        var deferred = q.defer();

        try{
            request.delete({url:uri}, function (error, response, body) {
                if(error){
                    throw new Error(error);
                }
                deferred.resolve(body);
            });
        }catch (error) {
            deferred.reject(error);
        }

        return deferred.promise;
    },

    getClient : function(id){
        var deferred = q.defer(),
            _getClient =  this.config._getClient.replace("{CLIENT_ID}",id),
            uri = this.config._apiUrl+_getClient;

        this.apiGet(uri).then(function(r){
            deferred.resolve(r);
        },function(e){
            deferred.reject(e);
        });

        return deferred.promise;
    },

    registerClient : function(udid){
        var deferred = q.defer(),
            uri = this.config._apiUrl+this.config._registerClient;

        var data = {
            udid : udid
        };

        this.apiPostJson(uri,data).then(function(r){
            deferred.resolve(r);
        },function(e){
            deferred.reject(e);
        });

        return deferred.promise;

    },

    updateClient : function(id,email,mobile){
        var deferred = q.defer(),
            _updateClient = this.config._updateClient.replace("{CLIENT_ID}",id),
            uri = this.config._apiUrl+_updateClient;

        var data = {
            email : email,
            mobile : mobile
        };

        this.apiPost(uri,data).then(function(r){
            deferred.resolve(r);
        },function(e){
            deferred.reject(e);
        });

        return deferred.promise;

    },

    registerAddress : function(id,address){
        var deferred = q.defer(),
            _registerAddress = this.config._registerAddress.replace("{CLIENT_ID}",id),
            uri = this.config._apiUrl+_registerAddress;

        var data = {
            address : address
        }

        this.apiPost(uri,data).then(function(r){
            deferred.resolve(r);
        },function(e){
            deferred.reject(e);
        });

        return deferred.promise;
    },

    getAddresses : function(addid){
        var deferred = q.defer(),
            _getAddresses = this.config._getAddresses.replace("{ADDRESS_ID}",addid),
            uri = this.config._apiUrl+_getAddresses;

        this.apiGet(uri).then(function(r){
            deferred.resolve(r);
        },function(e){
            deferred.reject(e);
        });

        return deferred.promise;
    },

    removeAddresses : function(addid){
        var deferred = q.defer(),
            _removeAddresses = this.config._removeAddresses.replace("{ADDRESS_ID}",addid),
            uri = this.config._apiUrl+_removeAddresses;

        this.apiDelete(uri).then(function(r){
            deferred.resolve(r);
        },function(e){
            deferred.reject(e);
        });

        return deferred.promise;

    },

    createOrder : function(order){
        var deferred = q.defer(),
            uri = this.config._apiUrl+this.config._createOrder;

        var data = {
            order : order
        }

        this.apiPost(uri,data).then(function(r){
            deferred.resolve(r);
        },function(e){
            deferred.reject(e);
        });

        return deferred.promise;
    },

    submitOrder : function(orderid,photos,offline_payment){

        console.log("submitOrder photos",photos);

        if(typeof offline_payment == "string" && offline_payment == "true") offline_payment = true;
        if(typeof offline_payment == "string" && offline_payment == "false") offline_payment = false;

        var deferred = q.defer(),
            _submitOrder = this.config._submitOrder,
            uri = this.config._apiUrl+_submitOrder;

        var order = {
            _id : orderid,
            photos : photos
        }
        var data = {
            order : order,
            offline_payment : offline_payment
        }

        this.apiPostJson(uri,data).then(function(r){
            deferred.resolve(r);
        },function(e){
            deferred.reject(e);
        });

        return deferred.promise;

    },

    cancelOrder : function(orderid){
        var deferred = q.defer(),
            _cancelOrder = this.config._cancelOrder.replace("{ORDER_ID}",orderid),
            uri = this.config._apiUrl+_cancelOrder;

        this.apiPost(uri,{}).then(function(r){
            deferred.resolve(r);
        },function(e){
            deferred.reject(e);
        });

        return deferred.promise;

    },

    getCoupon : function(clientid){
        var deferred = q.defer(),
            _getCoupon =  this.config._getCoupon.replace("{CLIENT_ID}",clientid),
            uri = this.config._apiUrl+_getCoupon;

        this.apiGet(uri).then(function(r){
            deferred.resolve(r);
        },function(e){
            deferred.reject(e);
        });

        return deferred.promise;

    },

    redeemCoupon : function(clientid,coupon){
        var deferred = q.defer(),
            uri = this.config._apiUrl+this.config._redeemCoupon;

        var data = {
            client_id : clientid,
            coupon_code : coupon
        };

        console.log(uri);
        console.log(data);

        this.apiPost(uri,data).then(function(r){
            console.log(r);
            deferred.resolve(r);
        },function(e){
            console.log("ERROR");
            console.log(e);
            deferred.reject(e);
        });

        return deferred.promise;

    },

    setOrderPayment : function(orderid,action,transaccion){

        transaccion = transaccion || null;

        var deferred = q.defer(),
            _ordersPayment = this.config._ordersPayment.replace("{ORDER_ID}",orderid),
            _ordersPayment =  _ordersPayment.replace("{ACTION}",action),
            uri = this.config._apiUrl+_ordersPayment;

        console.log(uri);

        var auth = {
            user: this.config._apiUser,
            password: this.config._apiPassword
        }
        this.apiPost(uri,{payment_data:transaccion},auth).then(function(r){
            console.log(r);
            deferred.resolve(r);
        },function(e){
            console.log("ERROR");
            console.log(e);
            deferred.reject(e);
        });

        return deferred.promise;

    }


}
