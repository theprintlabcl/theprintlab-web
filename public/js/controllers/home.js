var app = angular.module('onegorillaApp');

app.controller('HomeCtrl', function ($scope) {

	$scope.appClass = "bg-light";

	var $carousel = jQuery('#slider-home').flickity({
		"prevNextButtons": false,
		"pageDots": false,
		"setGallerySize": false,
		"autoPlay": 6000,
		"pauseAutoPlayOnHover": false
	});

	var flkty = $carousel.data(),
			currentIndex = 0;

	$carousel.on( 'dragEnd', function() {
		if(currentIndex==0&&flkty.flickity.selectedIndex==0) location.href="#/tutorial";
		currentIndex = flkty.flickity.selectedIndex;
	});


});

app.controller('HomeCuponCtrl', function ($scope,$http,$loading,$rootScope) {

	$scope.appClass = "";
	$scope.coupon_code = "";

	$scope.redeem = function(){
		if($scope.coupon_code==""){
			return false;
		}
		$loading.start('loading');

		$http.post("/api/coupons/redeem",{coupon_code:$scope.coupon_code}).then(function(res){
			if(res.data){
				$loading.finish('loading');
				$rootScope.loadCoupon(true);

			}
		},function(error){
			console.log(error);
		});
	}

});


app.controller('HomeInfoCtrl', function ($scope,$routeParams,$templateCache,$http) {

	$scope.appClass = "";
	$scope.page = "views/home/info-index.html";

	if(typeof $routeParams.page !== "undefined"){
		var template = "views/home/info-"+$routeParams.page+".html";

		$http.head(template).then(function(data){
			$scope.page = template;
		});
	}

});



app.controller('HomeTutorialCtrl', function ($scope) {

	$scope.appClass = "bg-light";

	var $carousel = jQuery('#slider-tutorial').flickity({
		"prevNextButtons": false,
		"setGallerySize": false
	});

	var flkty = $carousel.data(),
			cellElements = 0,
			currentIndex = 0;
	console.log($carousel)
	$carousel.on( 'dragEnd', function() {
		cellElements = $carousel.flickity('getCellElements').length-1;
		if(currentIndex==cellElements&&flkty.flickity.selectedIndex==cellElements) location.href="#/";
		currentIndex = flkty.flickity.selectedIndex;
	})

});