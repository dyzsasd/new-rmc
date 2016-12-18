angular.module('RmcUI.course', [
  'vjs.video'
])

.controller('CourseCtrl', [
  '$scope', '$rootScope', '$modal', '$routeParams', '$window', 'Course', 'Prof', 'UserCourse', 'toaster',
  function ($scope, $rootScope, $modal, $routeParams, $window, Course, Prof, UserCourse, toaster) {
    var course_id = $routeParams.course_id;

    $scope.course = {};
    $scope.profs = [];
    $scope.videos = [];
    $scope.has_video = false;
    $scope.user_course = undefined;

    $scope.mediaToggle = {
      sources: [
      ],
      poster: 'images/screen.jpg'
    };

    $scope.currentUser = {};
    $scope.isLogin = $scope.currentUser.hasOwnProperty('name');
    $scope.$watch(function () {
      return $rootScope.currentUser;
    }, function (newVal) {
      if (newVal)
        $scope.currentUser = newVal;
        $scope.isLogin = $scope.currentUser.hasOwnProperty('name');
    }, true);

    $scope.$watch('user_course', function (newVal) {
      if (newVal === undefined) {
        return;
      }
      if (newVal.read) {
        UserCourse.getVideos({id: course_id}).$promise
          .then(function (response) {
            $scope.videos = response;
            if ($scope.videos.length == 0) {
              $scope.has_video = false
              return {};
            } else {
              $scope.has_video = true
              return UserCourse.getVideoStream({_tk: $scope.videos[0].id}).$promise
            }
          })
          .then(function (response) {
            if (response.url !== undefined) {
              $scope.mediaToggle = {
                sources: [
                  {
                    src: response.url,
                    type: 'video/mp4'
                  },
                ],
                poster: 'images/screen.jpg'
              }
            } else {
              toaster.pop('error', 'Cannot find video url');
            }
           });
      }
    })

    Course.get({course_id: course_id}).$promise
      .then(function (response) {
        $scope.course = response;
        return Prof.getProfs({'prof_id': $scope.course.professor_ids}).$promise
      })
      .then(function (response) {
        $scope.profs = response;
        return UserCourse.getUserCourse({id: course_id}).$promise
      })
      .then(function (response) {
        if (response.status_code==401) {
          toaster.pop('error', 'please login!');
          return
        }
        $scope.user_course = response
      });

    $scope.change_video = function (video) {
      $scope.mediaToggle = {
        sources: [
          {
            src: "",
            type: 'video/mp4'
          },
        ],
        poster: 'images/screen.jpg'
      }

      UserCourse.getVideoStream({_tk: video.id}).$promise
        .then(function (response) {
          console.log(response);
          $scope.mediaToggle = {
            sources: [
              {
                src: response.url,
                type: 'video/mp4'
              },
            ],
            poster: 'images/screen.jpg'
          }
        });
    };

    $scope.buy = function (course_id) {
      UserCourse.pay({id: course_id}).$promise
        .then(function (response) {
          //$window.location.href ='https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_express-checkout&token=' + response.token
          console.log(response)
          $modal.open({
            animation: true,
            templateUrl: '/course/pay.html',
            windowClass: 'center-modal',
            size: 'sm',
            resolve: {
              paymentInfo: function () {
                return response;
              },
            },
            controller: [
              '$scope', '$modalInstance', 'paymentInfo',
              function (scope, $modalInstance, paymentInfo) {
                scope.is_paid = paymentInfo.is_paid;
                scope.price = paymentInfo.price;
                scope.course_id = paymentInfo.course_id;
                scope.payment_url = paymentInfo.payment_url;
                scope.cancel = function () {
                  $modalInstance.dismiss({$value: 'cancel'})
                }
              }]
          });
        })
    };


  }])

  .factory('Prof', ['$resource', function ($resource) {
    return $resource (
      '/api/prof/:handle/',
      {},
      {
        getProfs: {method: 'GET', isArray: true, params: {handle: 'collection'}}
      }
  )}])

  .factory('UserCourse', ['$resource', function ($resource) {
    return $resource (
      '/api/user_course/:id/:handle/',
      {},
      {
        getUserCourse: {method :'GET', isArray: false, params: {handle: 'user_course'}},
        getVideos: {method: 'GET', isArray: true, params: {handle: 'video'}},
        getVideoStream: {method: 'GET', isArray: false, params: {handle: 'stream'}},
        pay: {method: 'GET', isArray: false, params: {handle: 'pay'}},
      }
  )}])

  .factory('Course', ['$resource', function ($resource) {
    return $resource (
      '/api/course/get/:course_id',
      {},
      {
        get: {method: 'GET', isArray: false}
      }
  )}]);