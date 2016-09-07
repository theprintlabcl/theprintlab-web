var app = angular.module('onegorillaApp');

app.factory('API', function($http,$q){

    var self = this,
        q = $q,
        request = $http;

    var config = {
        //URL Api
        _apiUrl : "https://theprintlab-dev.herokuapp.com",
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
            _redeemCoupon : '/v1/coupons/redeem'
    };

    var apiGet = function(uri){
        var deferred = q.defer();
        console.log("GET ["+uri+"]");

        try{
            request({url: uri}, function (error, response, body) {
                if(error){
                    throw new Error(error);
                }
                deferred.resolve(body);
            });
        }catch (error) {
            deferred.reject(error);
        }

        return deferred.promise;
    };

    var apiPost = function(uri,data){
        var deferred = q.defer(),
            data = data || {};
        console.log("POST ["+uri+"]");
        console.log("--DATA--");
        console.log(data);
        console.log("--/DATA--");
        try{
            request.post({url:uri, form:data}, function (error, response, body) {
                if(error){
                    throw new Error(error);
                }
                deferred.resolve(body);
            });
        }catch (error) {
            deferred.reject(error);
        }

        return deferred.promise;
    };

    var apiDelete = function(uri){
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
    };

    self.getClient = function(id){
        var deferred = q.defer(),
            _getClient =  config._getClient.replace("{CLIENT_ID}",id),
            uri = config._apiUrl+_getClient;

        apiGet(uri).then(function(r){
            deferred.resolve(r);
        },function(e){
            console.log("ERR")
            deferred.reject(e);
        });

        return deferred.promise;
    };

    self.registerClient = function(udid){
        var deferred = q.defer(),
            uri = config._apiUrl+config._registerClient;

        var data = {
            udid : udid
        };

        apiPost(uri,data).then(function(r){
            deferred.resolve(r);
        },function(e){
            deferred.reject(e);
        });

        return deferred.promise;

    };

    self.updateClient = function(id,email,mobile){
        var deferred = q.defer(),
            _updateClient = config._updateClient.replace("{CLIENT_ID}",id),
            uri = config._apiUrl+_updateClient;

        var data = {
            email : email,
            mobile : mobile
        };

        apiPost(uri,data).then(function(r){
            deferred.resolve(r);
        },function(e){
            deferred.reject(e);
        });

        return deferred.promise;

    };

    self.registerAddress = function(id,address){
        var deferred = q.defer(),
            _registerAddress = config._registerAddress.replace("{CLIENT_ID}",id),
            uri = config._apiUrl+_registerAddress;

        var data = {
            address : address
        }

        apiPost(uri,data).then(function(r){
            deferred.resolve(r);
        },function(e){
            deferred.reject(e);
        });

        return deferred.promise;
    };

    self.getAddresses = function(addid){
        var deferred = q.defer(),
            _getAddresses = config._getAddresses.replace("{ADDRESS_ID}",addid),
            uri = config._apiUrl+_getAddresses;

        apiGet(uri).then(function(r){
            deferred.resolve(r);
        },function(e){
            deferred.reject(e);
        });

        return deferred.promise;
    };

    self.removeAddresses = function(addid){
        var deferred = q.defer(),
            _removeAddresses = config._removeAddresses.replace("{ADDRESS_ID}",addid),
            uri = config._apiUrl+_removeAddresses;

        apiDelete(uri).then(function(r){
            deferred.resolve(r);
        },function(e){
            deferred.reject(e);
        });

        return deferred.promise;

    };

    self.createOrder = function(order){
        var deferred = q.defer(),
            uri = config._apiUrl+config._createOrder;

        var data = {
            order : order
        }

        apiPost(uri,data).then(function(r){
            deferred.resolve(r);
        },function(e){
            deferred.reject(e);
        });

        return deferred.promise;
    };

    self.submitOrder = function(){

    };

    self.cancelOrder = function(orderid){
        var deferred = q.defer(),
            _cancelOrder = config._cancelOrder.replace("{ORDER_ID}",orderid),
            uri = config._apiUrl+_cancelOrder;

        apiPost(uri,{}).then(function(r){
            deferred.resolve(r);
        },function(e){
            deferred.reject(e);
        });

        return deferred.promise;

    };

    self.getCoupon = function(clientid){
        var deferred = q.defer(),
            _getCoupon =  config._getCoupon.replace("{CLIENT_ID}",clientid),
            uri = config._apiUrl+_getCoupon;

        apiGet(uri).then(function(r){
            deferred.resolve(r);
        },function(e){
            deferred.reject(e);
        });

        return deferred.promise;

    };

    self.redeemCoupon = function(clientid,coupon){
        var deferred = q.defer(),
            uri = config._apiUrl+config._redeemCoupon;

        var data = {
            client_id : clientid,
            coupon_code : coupon
        };

        apiPost(uri,data).then(function(r){
            deferred.resolve(r);
        },function(e){
            deferred.reject(e);
        });

        return deferred.promise;

    };


    return self;

});