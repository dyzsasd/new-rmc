angular.module('RmcUI.index', [])

.controller('IndexCtrl', ['$scope', '$timeout',
  function ($scope, $timeout) {

    $scope.input = "";

    $scope.search = function (input) {
        console.log(input)
    };

    function scaleVideoContainer() {
        var height = $(window).height() + 5;
        var unitHeight = parseInt(height) + 'px';
        $('.homepage-hero-module').css('height', unitHeight);
    }

    function initBannerVideoSize(element) {
        $(element).each(function () {
            $(this).data('height', $(this).height());
            $(this).data('width', $(this).width());
        });
        scaleBannerVideoSize(element);
    }

    function init() {
        scaleVideoContainer();
        initBannerVideoSize('.video-container .poster img');
        initBannerVideoSize('.video-container .filter');
        initBannerVideoSize('.video-container video');

        $("#recommend-slider").owlCarousel({
            autoPlay: 3000, //Set AutoPlay to 3 seconds
            items: 3
            , itemsDesktop: [1199, 3]
            , itemsDesktopSmall: [992, 2]
            , itemsMobile: [767, 1]
            , stopOnHover: true
        });
        $("#hot-slider").owlCarousel({
            autoPlay: 3000, //Set AutoPlay to 3 seconds
            items: 3
            , itemsDesktop: [1199, 3]
            , itemsDesktopSmall: [992, 2]
            , itemsMobile: [767, 1]
            , stopOnHover: true
        });
        $("#popular-slider").owlCarousel({
            autoPlay: 3000, //Set AutoPlay to 3 seconds
            items: 3
            , itemsDesktop: [1199, 3]
            , itemsDesktopSmall: [992, 2]
            , itemsMobile: [767, 1]
            , stopOnHover: true
        });
        $(".loader").fadeOut("fast");
        $(".loader2").fadeOut("fast");
    };

    $timeout(function () {
        init();
      }, 1000)
  }]);
