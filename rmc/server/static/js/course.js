angular.module('RmcUI.course', [
  'vjs.video'
])

.controller('CourseCtrl', [
  '$scope', '$modal', '$routeParams', 'Course', 'Prof', 'UserCourse',
  function ($scope, $modal, $routeParams, Course, Prof, UserCourse) {
    var course_id = $routeParams.course_id;

    $scope.course = {};
    $scope.profs = [];
    $scope.videos = [];
    $scope.mediaToggle = {
      sources: [
      ],
      poster: 'images/screen.jpg'
    };

    Course.get({course_id: course_id}).$promise
      .then(function (response) {
        $scope.course = response;
        return Prof.getProfs({'prof_id': $scope.course.professor_ids}).$promise
      })
      .then(function (response) {
        $scope.profs = response;
        console.log('profs: ', $scope.profs)
      })

    UserCourse.getVideos({id: course_id}).$promise
      .then(function (response) {
        $scope.videos = response;
        console.log(response)
        $scope.mediaToggle = {
          sources: [
            {
              src: $scope.videos[0].url,
              type: 'video/mp4'
            },
          ],
          poster: 'images/screen.jpg'
        };
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

      UserCourse.getVideoStream({id: course_id, _tk: video.id}).$promise
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
        getVideos: {method: 'GET', isArray: true, params: {handle: 'video'}},
        getVideoStream: {method: 'GET', isArray: false, params: {handle: 'stream'}}
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