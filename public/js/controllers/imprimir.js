var app = angular.module('onegorillaApp');

app.controller('ImprimiIndexrCtrl', function ($scope,$rootScope) {

    $scope.appClass = "";

    $scope.anchoThumb = "";

    $scope.$watch('qtypics',function(){
        if($rootScope.qtypics == 0){
            $scope.templateImprimir = "imprimirIndex.html";
        }else{
            $scope.templateImprimir = "imprimirAdd.html";
        }
    });


    $scope.addFiles = function(files, errFiles) {

        angular.forEach(files,function(value,key){
            if($rootScope.files==null){
                $rootScope.files=[];
            }

            var f = files[key];
            f.qty = 1;
            $rootScope.qtypics++;
            $rootScope.updateGlobalQty();
            $rootScope.files.push(f);
        });

    }

    angular.element(document).ready(function () {

        var cw = Math.round ( angular.element(".app-wrap").width() / 3 ) ;
        $scope.anchoThumb = cw;
    });



});

app.controller('ImprimiSeleccionCtrl', function ($scope,$rootScope) {

    $scope.appClass = "";
    $scope.anchoThumb = "";

    $scope.$watch('qtypics',function(){
        if($rootScope.qtypics == 0){
            location.href="#/imprimir";
        }
    });

    angular.element(document).ready(function () {

        var cw = Math.round ( angular.element(".app-wrap").width() - 50) ;
        $scope.anchoThumb = cw;
    });

});

app.controller('ImprimiResumenCtrl', function ($scope,$rootScope) {

    $scope.appClass = "";


    $scope.grafico_data = {};
    $scope.grafico_option = {
        responsive: true,
        legend: {
            display: false,
        },
        //The percentage of the chart that is cut out of the middle.
        cutoutPercentage: 80,
        // Begins from bottom
        rotation: -1.5 * Math.PI,


        animation: {
            //animateScale: true,
            animateRotate: true
        }
    }

    var additionalimages = $rootScope.qtypics - $rootScope.config.baseqty;

    if(additionalimages>0){
        var additionalimages_group = Math.ceil(additionalimages / $rootScope.config.qtyplus);
        var additionalimages_price = additionalimages_group * $rootScope.config.qtyplusprice;
        var totalpricepics = additionalimages_price + $rootScope.config.baseqtyprice;
        $rootScope.price.pics = totalpricepics;
        $rootScope.price.shipping = $rootScope.config.costshipping;
        $rootScope.price.total = $rootScope.price.pics + $rootScope.price.shipping;
    }else{
        $rootScope.price.pics = $rootScope.config.baseqtyprice;
        $rootScope.price.shipping = $rootScope.config.costshipping;
        $rootScope.price.total = $rootScope.price.pics + $rootScope.price.shipping;
    }


    $scope.grafico_data = {
        datasets: [{
            data: [$rootScope.price.pics,$rootScope.price.shipping],
            borderWidth: 0,
            backgroundColor: [
                "#b6ce32", // Green
                "#5b6b78"
            ],
            label: 'Dataset 1'
        }],
        labels: [
            "Enviadas",
            "Pendientes"
        ]
    };

});

app.controller('ImprimiCropCtrl', function ($scope,$rootScope,$routeParams) {

    var index = $routeParams.index;

    if(!angular.isArray($rootScope.files) || $rootScope.isEmpty($rootScope.files[index]) ){
       // location.href="#/imprimir/seleccion";
    }

    /*var file = $rootScope.files[index];
    var fileReader = new FileReader();
    fileReader.onload = function(fileLoadedEvent)
    {
        $scope.dataUrl = fileLoadedEvent.target.result;
        $scope.$broadcast($scope.showEvent);
    };

    fileReader.readAsDataURL(file);*/

    //console.log(angular.element(angular.element(document.querySelector(".photo-item")[0]).clientWidth))
    $scope.cropfile = $rootScope.files[index];
    var anchoDiv = angular.element(".photo-item").width(),
        anchoImagen = $scope.cropfile.$ngfWidth,
        altoImagen = $scope.cropfile.$ngfHeight;


    switch(true){
        case (anchoImagen==altoImagen):
                $scope.canvas = {
                    "width" : anchoImagen,
                    "height" : anchoImagen
                };
            break;
        case (anchoImagen>altoImagen):
        case (anchoImagen<altoImagen):
                var height = Math.round((anchoImagen/3)*2);
                $scope.canvas = {
                    "width" : anchoImagen,
                    "height" : height
                };
            break;
    }

    function dataURItoBlob(dataURI) {
        // convert base64/URLEncoded data component to raw binary data held in a string
        var byteString;
        if (dataURI.split(',')[0].indexOf('base64') >= 0)
            byteString = atob(dataURI.split(',')[1]);
        else
            byteString = unescape(dataURI.split(',')[1]);

        // separate out the mime component
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

        // write the bytes of the string to a typed array
        var ia = new Uint8Array(byteString.length);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        return new Blob([ia], {type:mimeString});
    }

    console.log($scope.cropfile);
    $scope.cropper = null;

    $scope.setCrop = function(){
        var blob = dataURItoBlob($scope.cropper.toDataURL());
        var file = new File([blob], $scope.cropfile.name);
        file.qty = $scope.cropfile.qty;
        $rootScope.files[index] = file;
        console.log(file)
        location.href="#/imprimir/seleccion";
    }




});

app.controller('ImprimiDatosEnvioCtrl', function ($scope,$rootScope,$http,$loading) {

    $loading.start('loading');

    $scope.dropdownactive = "";


    $scope.setDropdown = function(id){

        if($scope.dropdownactive==id){
            $scope.dropdownactive = "";
        }else{
            $scope.dropdownactive = id;
        }
    }

    $scope.getAddresses = function(){
        $rootScope.addresses = [];
        $http.get("/api/client").then(function(res){
            if(res.data.client){
                $loading.finish('loading');

                angular.forEach(res.data.client.addresses, function(value, key) {
                    $http.get("/api/addresses/"+value).then(function(addres){
                        $rootScope.addresses.push(addres.data.address);
                    });
                });
            }
        },function(error){
            console.log(error);
        });
    }

    $scope.getAddresses();

    $scope.deleteAddress = function(id,index){
        $http.delete("/api/addresses/"+id).then(function(res){
            $rootScope.addresses.splice(index, 1);
        },function(error){
            console.log(error);
        });
    }

    $scope.selectAddress = function(id){
        $rootScope.selectedaddress=id;
    }

});

app.controller('ImprimiDireccionCtrl', function ($scope,$rootScope,$http,$routeParams,$loading) {

    $scope.direccion = {
        name : "",
        last_name : "",
        address_line1 : "",
        address_line2 : "",
        region : "",
        provincia : "",
        comuna : ""
    };

    $scope.region_selected = {};
    $scope.provincia_selected = {};
    $scope.comuna_selected = {};

    /*if($routeParams.id){

        $http.get('/api/addresses/'+$routeParams.id).then(function(res){
            var address = res.data.address;
            if(typeof address === "undefined"){
                location.href="#/imprimir/datosenvio";
            }

            $scope.direccion = {
                name : address.name,
                last_name : address.last_name,
                address_line1 : address.address_line1,
                address_line2 : address.address_line2,
                region : address.region,
                provincia : address.provincia,
                comuna : address.comuna
            };

        });

    }*/


    $scope.regiones = [];
    $scope.provincias = [];
    $scope.comunas = [];

    $scope.formvalid = false;

    $scope.$watchCollection('direccion',function(newValue, oldValue){
        if(newValue.name==""||
            newValue.last_name==""||
            newValue.address_line1==""||
            newValue.region==""||
            newValue.provincia==""||
            newValue.comuna==""){

            $scope.formvalid = false;
        }else{
            $scope.formvalid = true;
        }
    });

    $scope.$watchGroup(['region_selected','provincia_selected','comuna_selected'],function(newNames, oldNames){

        var regionNew = newNames[0],
            provinciaNew = newNames[1],
            comunaNew = newNames[2];

        if(!$rootScope.isEmpty(regionNew)) $scope.direccion.region = regionNew.name;
        if(!$rootScope.isEmpty(provinciaNew)) $scope.direccion.provincia = provinciaNew.name;
        if(!$rootScope.isEmpty(comunaNew)) $scope.direccion.comuna = comunaNew.name;

    });

    $scope.setDireccion = function(){

        $loading.start('loading');

        $http.post('/api/addresses',{address : $scope.direccion}).then(function(res){
            $loading.finish('loading');
            location.href="#/imprimir/datosenvio";
        },function(error){
            $loading.finish('loading');
            location.href="#/imprimir/datosenvio";
        })

    }

    $scope.loadRegiones = function(){
        $http.get('/api/regiones').then(function(res){
            $scope.regiones = res.data;
        });
    }
    $scope.loadRegiones();

    $scope.loadProvincias = function(){

        $scope.provincia_selected = {};

        if(typeof $scope.region_selected.region_id !== "undefined" && $scope.region_selected.region_id != ""){

            $http.get('/api/provincias/'+$scope.region_selected.region_id).then(function(res){
                $scope.provincias = res.data;
                $scope.loadComunas();
            });

        }else{
            $scope.provincias = [];
            $scope.loadComunas();
        }
    }

    $scope.loadComunas = function(){

        $scope.comuna_selected = {};

        if(typeof $scope.provincia_selected.provincia_id !== "undefined" && $scope.provincia_selected.provincia_id != ""){

            $http.get('/api/comunas/'+$scope.provincia_selected.provincia_id).then(function(res){
                $scope.comunas = res.data;
            });

        }else{
            $scope.comunas = [];
        }
    }

});

app.controller('ImprimiContactoCtrl', function ($scope,$rootScope,$http,$loading) {

    $scope.$watchGroup(['email','phone'],function(newNames, oldNames){
        if(newNames[0]!=""&&newNames[1]!=""&&validateEmail(newNames[0])){
            $rootScope.validcontact=true;
        }else{
            $rootScope.validcontact=false;
        }
    });

    var validateEmail = function(email) {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    }

    $scope.crearOrden = function(){

        $loading.start('loading');

        var data = {
            address : $rootScope.selectedaddress,
            photo_count : $rootScope.qtypics,
            cost_printing : $rootScope.price.pics,
            cost_shipping : $rootScope.price.shipping,
            cost_total : $rootScope.price.total,
            gift : $rootScope.gift,
            verbose : $rootScope.message,
            coupon_code : $rootScope.cupon
        };
        $http.post('/api/orders/create',data).then(function(res){
            $rootScope.order = res.data.order;
            console.log($rootScope.order)
            $loading.finish('loading');
            location.href="#/imprimir/pago";
        });
        //location.href="#/imprimir/pago";

    }

});

app.controller('ImprimiPagoCtrl', function ($scope,$rootScope) {

    $scope.pagoTransferencia = function(){
        $rootScope.openModal('#modal-transfer');
    }

    $scope.pagoTransferenciaAceptar = function(){

        jQuery.magnificPopup.close();
        $rootScope.pago_transferencia = true;
        $rootScope.pago_webpay = false;
        location.href="#/imprimir/upload";

    }

    $scope.pagoWebpay = function(){

        jQuery.magnificPopup.close();
        $rootScope.pago_webpay = true;
        $rootScope.pago_transferencia = false;
        location.href="#/imprimir/upload";

    }

});

app.controller('ImprimiUploadCtrl', function ($scope,$rootScope,Upload,$timeout,$http) {

    if($rootScope.pago_transferencia === false && $rootScope.pago_webpay === false){
        location.href="#/imprimir/pago";
    }

    $scope.qtytrans = 0;
    $scope.pupload = 0;

    $scope.grafico_data = {};
    $scope.grafico_option = {
        responsive: true,
        legend: {
            display: false,
        },
        //The percentage of the chart that is cut out of the middle.
        cutoutPercentage: 80,
        // Begins from bottom
        rotation: -1.5 * Math.PI,


        animation: {
            //animateScale: true,
            animateRotate: true
        }
    }

    $scope.grafico_data = {
        datasets: [{
            data: [0,100],
            borderWidth: 0,
            backgroundColor: [
                "#b6ce32", // Green
                "#5b6b78"
            ],
            label: 'Dataset 1'
        }],
        labels: [
            "",
            ""
        ]
    };

    var submitOrder = function(payment){
        $scope.qtytrans = 0;
        $scope.pupload = 0;

        var qtypics = $rootScope.qtypics;

        var infofiles = [];
        for(var i=0;i<$rootScope.files.length;i++){
            var _f = $rootScope.files[i];
            var _n = $rootScope.order._id+"_img_"+i;
            $rootScope.files[i] = Upload.rename($rootScope.files[i], _n);
            infofiles[_n] = _f.qty;
        }

        var upload = Upload.upload({
            url: '/api/orders/submit',
            data: {
                file : $rootScope.files,
                order : $rootScope.order._id,
                offline_payment : payment,
                infofiles : infofiles
            },
            method: 'POST'
        });

        upload.then(function(resp) {
            // file is uploaded successfully
            //console.log('file ' + resp.config.data.file.name + 'is uploaded successfully. Response: ' + resp.data);
            console.log(resp.data);
            if(resp.data=="OK" && resp.status == 200){
                $rootScope.upload_done = true;

                if($rootScope.pago_webpay){
                    $timeout(function(){
                        location.href="#/imprimir/webpay";
                    },2000);
                }else{
                    $timeout(function(){
                        location.href="#/imprimir/estamoslistos";
                    },2000);
                }
            }else{
                submitOrder(payment);
            }
        }, function(resp) {
            // handle error
            console.log("ERROR");
            console.log(resp);
        }, function(evt) {

            // progress notify
            console.log('progress: ' + parseInt(100.0 * evt.loaded / evt.total) + '%');
            var _p =  parseInt(100.0 * evt.loaded / evt.total),
                _pt = 100 - _p;
            $scope.pupload = _p;
            $scope.qtytrans = Math.round( (qtypics / 100 ) * _p );
            console.log(_p + " - " + _pt);

            $scope.grafico_data = {
                datasets: [{
                    data: [_p,_pt],
                    borderWidth: 0,
                    backgroundColor: [
                        "#b6ce32", // Green
                        "#5b6b78"
                    ],
                    label: 'Dataset 1'
                }],
                labels: [
                    "",
                    ""
                ]
            };
        });
    }

    submitOrder($rootScope.pago_transferencia);




});

app.controller('ImprimirWebpayCtrl', function ($scope,$rootScope,$timeout,$http,$sce) {
    if(!$rootScope.upload_done){
        location.href="#/imprimir/upload";
    }
    var data = {
        orderid : $rootScope.order._id,
        total:$rootScope.price.total
    }
    $scope.webpay_url = "";
    $scope.token = "";
    $scope.webpayResponse = false;

    var trust = function(src){
        return $sce.trustAsResourceUrl(src);
    }

    $http.post('/webpay/init',data).then(function(res){
        //$rootScope.order = res.data.order;
        if(res.data.estado == "ok"){
            $scope.webpayResponse = true;
            $scope.webpay_url = trust(res.data.tbk_url);
            $scope.webpay_token = res.data.token;
        }else if(res.data.estado == "duplicada"){
            $rootScope.webpayerror = res.data.mensaje;
            location.href="#/imprimir/webpay-error-msg/";
        }else{
            location.href="#/imprimir/webpay-error/"+$rootScope.order._id;
        }
    });
});

app.controller('ImprimirWebpayErrorCtrl', function ($scope,$routeParams) {

    $scope.orderid = $routeParams.order || "";

});

app.controller('ImprimirWebpayAnuladoCtrl', function ($scope,$routeParams,$rootScope,$timeout,$http,$sce) {

    $scope.orderid = $routeParams.order || "";
    $scope.webpayResponse = false;

    var data = {
        order : $scope.orderid
    }

    var trust = function(src){
        return $sce.trustAsResourceUrl(src);
    }

    $http.post('/webpay/json',data).then(function(res){
        if(res.data){
            console.log("/webpay/json");
            console.log(res.data);
            if(typeof res.data === "object"){
                var orden = res.data;

                var datainit = {
                    orderid : orden._id,
                    total:orden.monto
                }

                $scope.order = {
                    _id : orden._id,
                    total : orden.monto
                }

                $http.post('/webpay/init',datainit).then(function(resinit){
                    console.log(resinit.data.estado)
                    //$rootScope.order = res.data.order;
                    if(resinit.data.estado == "ok"){
                        $scope.webpayResponse = true;
                        $scope.webpay_url = trust(resinit.data.tbk_url);
                        $scope.webpay_token = resinit.data.token;
                    }
                });
            }
        }
    });

});

app.controller('ImprimirWebpayOkCtrl', function ($scope,$routeParams,$http) {

    $scope.webpayJson = {};

    var data = {
        order : $routeParams.order
    }

    $http.post('/webpay/json',data).then(function(res){
        if(res.data){
            if(typeof res.data === "object"){
                $scope.webpayJson = angular.fromJson(res.data.jsontbk);
            }
        }
    });

});