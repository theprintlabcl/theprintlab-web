var onegorillaApp = angular.module('onegorillaApp', [
	'ngRoute',
	'ngAnimate',
	'ngFileUpload',
	'ngCookies',
	'tc.chartjs',
	'darthwade.dwLoading',
	'tw.directives.cropper',
	'angular-thumbnails'
]).run(function($rootScope,$window,beforeUnload,$cookies,$http) {

	console.log($cookies.getAll());

	$rootScope.udid = $cookies.get("printlab_udid");
	$rootScope.id = $cookies.get("printlab_id");
	console.log($rootScope.id);



	$rootScope.beforeUnload = null;

	$rootScope.setBeforeUnload = function(){
		$rootScope.beforeUnload = $rootScope.$on('onBeforeUnload', function (e, confirmation) {
			confirmation.message = "All data willl be lost.";
			e.preventDefault();
		});
	}

	//Global vars
	$rootScope.setConfigInicial = function(){
		$rootScope.config = {
			baseqty : 20,
			qtyplus : 5,
			qtyplusprice : 1000,
			baseqtyprice : 5000,
			costshipping : 1500
		};
		$rootScope.qtypics = 0;
		$rootScope.files = null;
		$rootScope.errFiles = null;
		$rootScope.warningpics = false;
		$rootScope.maxqtypics = 20;
		$rootScope.availablepics = 20;
		$rootScope.price = {
			pics : 0,
			shipping : 0,
			total : 0
		};
		$rootScope.selectedaddress = "";
		$rootScope.addresses = [];
		$rootScope.email = "";
		$rootScope.phone = "";
		$rootScope.gift = false;
		$rootScope.message = "";
		$rootScope.validcontact = false;
		$rootScope.cupon = "";
		$rootScope.order = false;
		$rootScope.pago_webpay = false;
		$rootScope.pago_transferencia = false;
		$rootScope.upload_done = false;
		$rootScope.webpayerror = "";


	}
	$rootScope.setConfigInicial();
	

	//Global functions
	$rootScope.updateGlobalQty = function(){

		if($rootScope.qtypics>$rootScope.maxqtypics){
			$rootScope.maxqtypics = $rootScope.maxqtypics+$rootScope.config.qtyplus;
		}

		if($rootScope.maxqtypics>20&&($rootScope.qtypics<=($rootScope.maxqtypics-$rootScope.config.qtyplus))){
			$rootScope.maxqtypics = $rootScope.maxqtypics-$rootScope.config.qtyplus;
		}

		$rootScope.availablepics = $rootScope.maxqtypics - $rootScope.qtypics;

		if($rootScope.availablepics>0){
			$rootScope.warningpics = true;
		}else{
			$rootScope.warningpics = false;
		}

	}

	$rootScope.updateGlobalQty();

	$rootScope.updateQty = function(index,acc){

		var t = $rootScope.files[index];

		switch(acc){
			case "+":
				if(t) t.qty = t.qty+1; $rootScope.files[index] = t;

				$rootScope.qtypics++;
				$rootScope.updateGlobalQty();
				break;
			case "-":
				if(t && t.qty>1) {
					$rootScope.qtypics--;
					$rootScope.updateGlobalQty();
					t.qty = t.qty-1;
					$rootScope.files[index] = t;
				}
				break;
		}

	}

	$rootScope.deleteImage = function(index){
		$rootScope.qtypics = $rootScope.qtypics - $rootScope.files[index].qty;
		$rootScope.files.splice(index, 1);
	}

	$rootScope.openModal = function(modal){
		jQuery.magnificPopup.open({
			items : {
				src: modal
			},
			type: 'inline',
			showCloseBtn: false,
			midClick: true,
			mainClass: 'animate-modal'
		}, 0);

		jQuery('.modal-close').click(function(e) {
			$.magnificPopup.close();
			e.preventDefault();
		});
	}

	$rootScope.isEmpty = function(obj) {
		for(var prop in obj) {
			if(obj.hasOwnProperty(prop))
				return false;
		}

		return true && JSON.stringify(obj) === JSON.stringify({});
	}

	$rootScope.loadCoupon = function(redirect){

		$http.post("/api/coupons").then(function(res){
			var coupon = res.data.coupons[0];
			if(typeof coupon !== "undefined"){

				$rootScope.config = {
					baseqty : coupon.rules.qty_base,
					qtyplus : coupon.rules.qty_add,
					qtyplusprice : coupon.rules.cost_add,
					baseqtyprice : coupon.rules.cost_base,
					costshipping : coupon.rules.cost_shipping_flat
				};
				$rootScope.maxqtypics = coupon.rules.qty_base;
				$rootScope.availablepics = coupon.rules.qty_base;
				$rootScope.qtypics = 0;
				$rootScope.files = null;
				$rootScope.cupon = coupon.code;

				if(redirect){
					location.href="#/imprimir";
				}

			}
		},function(error){
			console.log(error);
		});

	}
	$rootScope.loadCoupon(false);
});

onegorillaApp.config(['$routeProvider',
	function($routeProvider) {
		$routeProvider.
		when('/', {
			templateUrl: 'views/home/index.html',
			controller: 'HomeCtrl'
		}).
		when('/tutorial', {
			templateUrl: 'views/home/tutorial.html',
			controller: 'HomeTutorialCtrl'
		}).
		when('/imprimir', {
			templateUrl: 'views/imprimir/index.html',
			controller: 'ImprimiIndexrCtrl'
		}).
		when('/imprimir/seleccion', {
			templateUrl: 'views/imprimir/seleccion.html',
			controller: 'ImprimiSeleccionCtrl'
		}).
		when('/imprimir/resumen', {
			templateUrl: 'views/imprimir/resumen.html',
			controller: 'ImprimiResumenCtrl'
		}).
		when('/imprimir/crop/:index', {
			templateUrl: 'views/imprimir/crop.html',
			controller: 'ImprimiCropCtrl'
		}).
		when('/imprimir/datosenvio', {
			templateUrl: 'views/imprimir/datosenvio.html',
			controller: 'ImprimiDatosEnvioCtrl'
		}).
		when('/imprimir/direccion/:id?', {
			templateUrl: 'views/imprimir/direccion.html',
			controller: 'ImprimiDireccionCtrl'
		}).
		when('/imprimir/contacto', {
			templateUrl: 'views/imprimir/contacto.html',
			controller: 'ImprimiContactoCtrl'
		}).
		when('/imprimir/pago', {
			templateUrl: 'views/imprimir/pago.html',
			controller: 'ImprimiPagoCtrl'
		}).
		when('/info/cupon', {
			templateUrl: 'views/home/cupon.html',
			controller: 'HomeCuponCtrl'
		}).
		when('/info/:page?', {
			templateUrl: 'views/home/info.html',
			controller: 'HomeInfoCtrl'
		}).
		when('/imprimir/upload', {
			templateUrl: 'views/imprimir/upload.html',
			controller: 'ImprimiUploadCtrl'
		}).
		when('/imprimir/webpay', {
			templateUrl: 'views/imprimir/webpay.html',
			controller: 'ImprimirWebpayCtrl'
		}).
		when('/imprimir/webpay-error/:order?', {
			templateUrl: 'views/imprimir/webpay-error.html',
			controller: 'ImprimirWebpayErrorCtrl'
		}).
		when('/imprimir/webpay-error-msg', {
			templateUrl: 'views/imprimir/webpay-error-msg.html'
		}).
		when('/imprimir/webpay-ok/:order', {
			templateUrl: 'views/imprimir/webpay-ok.html',
			controller: 'ImprimirWebpayOkCtrl'
		}).
		when('/imprimir/webpay-anulado/:order', {
			templateUrl: 'views/imprimir/webpay-anular.html',
			controller: 'ImprimirWebpayAnuladoCtrl'
		}).
		when('/imprimir/estamoslistos', {
			templateUrl: 'views/imprimir/estamoslistos.html'
		}).
		when('/imprimir/gracias', {
			templateUrl: 'views/imprimir/gracias.html',
			controller: 'ImprimirGraciasCtrl'
		}).
		otherwise({
			redirectTo: '/'
		});
	}
]);

onegorillaApp.filter('cerofill', function() {

	return function(number) {

		if(isNaN(number) || number < 1) {
			return number;
		} else {

			if(number<10){
				return "0"+number;
			}else{
				return number;
			}

		}
	}
});

onegorillaApp.filter('miles', function(){
	return function(number){

		if(isNaN(number) || number < 1) {
			return number;
		} else {

			return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

		}

	}
});

onegorillaApp.filter('tipodepago', function(){
	return function(d){

		var _r = "";
		switch(d){
			case "VD":
				 _r = "Débito";
				break;
			case "VN":
			case "VC":
			case "SI":
			case "S2":
			case "NC":
				_r = "Crédito"
				break;
		}
		return _r;
	}
});

onegorillaApp.filter('tipocuotas', function(){
	return function(d){

		var _r = "";
		switch(d){
			case "VD":
				_r = "Venta débito";
				break;
			case "VN":
				_r = "Sin cuotas";
				break;
			case "VC":
				_r = "Cuotas normales";
				break;
			case "SI":
				_r = "Sin interés";
				break;
			case "S2":
				_r = "Sin interés";
				break;
			case "NC":
				_r = "Sin interés";
				break;
		}
		return _r;
	}
});

onegorillaApp.filter('numerocuotas', function(){
	return function(d){

		var _r = "";
		switch(d){
			case "VD":
				_r = "0";
				break;
			case "VN":
				_r = "0";
				break;
			case "VC":
				_r = "4-48";
				break;
			case "SI":
				_r = "3";
				break;
			case "S2":
				_r = "2";
				break;
			case "NC":
				_r = "2-10";
				break;
		}
		return _r;
	}
});


onegorillaApp.factory('beforeUnload', function ($rootScope, $window) {

	// Events are broadcast outside the Scope Lifecycle

	$window.onbeforeunload = function (e) {
		var confirmation = {};
		var event = $rootScope.$broadcast('onBeforeUnload', confirmation);
		if (event.defaultPrevented) {
			return confirmation.message;
		}
	};

	$window.onunload = function () {
		$rootScope.$broadcast('onUnload');
	};

	return {};
});

onegorillaApp.directive("limitTo", [function() {
	return {
		restrict: "A",
		link: function(scope, elem, attrs) {
			var limit = parseInt(attrs.limitTo);
			angular.element(elem).on("keypress", function(e) {
				if (this.value.length == limit) e.preventDefault();
			});
		}
	}
}]);
