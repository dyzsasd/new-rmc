//jQuery is required to run this code
$(document).ready(function () {
    /* page loader*/
    $(window).load(function () {
        // Animate loader off screen
        $(".loader").fadeOut("slow");
    });
    scaleVideoContainer();
    initBannerVideoSize('.video-container .poster img');
    initBannerVideoSize('.video-container .filter');
    initBannerVideoSize('.video-container video');
    $(window).on('resize', function () {
        scaleVideoContainer();
        scaleBannerVideoSize('.video-container .poster img');
        scaleBannerVideoSize('.video-container .filter');
        scaleBannerVideoSize('.video-container video');
    });
});

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

function scaleBannerVideoSize(element) {
    var windowWidth = $(window).width()
        , windowHeight = $(window).height() + 5
        , videoWidth, videoHeight;
    $(element).each(function () {
        var videoAspectRatio = $(this).data('height') / $(this).data('width');
        $(this).width(windowWidth);
        if (windowWidth < 1000) {
            videoHeight = windowHeight;
            videoWidth = videoHeight / videoAspectRatio;
            $(this).css({
                'margin-top': 0
                , 'margin-left': -(videoWidth - windowWidth) / 2 + 'px'
            });
            $(this).width(videoWidth).height(videoHeight);
        }
        $('.homepage-hero-module .video-container video').addClass('fadeIn animated');
    });
}
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
// Starrr plugin (https://github.com/dobtco/starrr)
var __slice = [].slice;
(function ($, window) {
    var Starrr;
    Starrr = (function () {
        Starrr.prototype.defaults = {
            rating: void 0
            , numStars: 5
            , change: function (e, value) {}
        };

        function Starrr($el, options) {
            var i, _, _ref, _this = this;
            this.options = $.extend({}, this.defaults, options);
            this.$el = $el;
            _ref = this.defaults;
            for (i in _ref) {
                _ = _ref[i];
                if (this.$el.data(i) != null) {
                    this.options[i] = this.$el.data(i);
                }
            }
            this.createStars();
            this.syncRating();
            this.$el.on('mouseover.starrr', 'span', function (e) {
                return _this.syncRating(_this.$el.find('span').index(e.currentTarget) + 1);
            });
            this.$el.on('mouseout.starrr', function () {
                return _this.syncRating();
            });
            this.$el.on('click.starrr', 'span', function (e) {
                return _this.setRating(_this.$el.find('span').index(e.currentTarget) + 1);
            });
            this.$el.on('starrr:change', this.options.change);
        }
        Starrr.prototype.createStars = function () {
            var _i, _ref, _results;
            _results = [];
            for (_i = 1, _ref = this.options.numStars; 1 <= _ref ? _i <= _ref : _i >= _ref; 1 <= _ref ? _i++ : _i--) {
                _results.push(this.$el.append("<span class='glyphicon .glyphicon-star-empty'></span>"));
            }
            return _results;
        };
        Starrr.prototype.setRating = function (rating) {
            if (this.options.rating === rating) {
                rating = void 0;
            }
            this.options.rating = rating;
            this.syncRating();
            return this.$el.trigger('starrr:change', rating);
        };
        Starrr.prototype.syncRating = function (rating) {
            var i, _i, _j, _ref;
            rating || (rating = this.options.rating);
            if (rating) {
                for (i = _i = 0, _ref = rating - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
                    this.$el.find('span').eq(i).removeClass('glyphicon-star-empty').addClass('glyphicon-star');
                }
            }
            if (rating && rating < 5) {
                for (i = _j = rating; rating <= 4 ? _j <= 4 : _j >= 4; i = rating <= 4 ? ++_j : --_j) {
                    this.$el.find('span').eq(i).removeClass('glyphicon-star').addClass('glyphicon-star-empty');
                }
            }
            if (!rating) {
                return this.$el.find('span').removeClass('glyphicon-star').addClass('glyphicon-star-empty');
            }
        };
        return Starrr;
    })();
    return $.fn.extend({
        starrr: function () {
            var args, option;
            option = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
            return this.each(function () {
                var data;
                data = $(this).data('star-rating');
                if (!data) {
                    $(this).data('star-rating', (data = new Starrr($(this), option)));
                }
                if (typeof option === 'string') {
                    return data[option].apply(data, args);
                }
            });
        }
    });
})(window.jQuery, window);
$(function () {
    return $(".starrr").starrr();
});
$(document).ready(function () {
    $('#stars').on('starrr:change', function (e, value) {
        $('#count').html(value);
    });
    $('#stars-existing').on('starrr:change', function (e, value) {
        $('#count-existing').html(value);
    });
});
