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
        console.log('course:', response)
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
        $scope.videos = [
          {
           "id": "a12ab51b04344ce1bccd0d428d6e2c0d",
           "catalog": "351",
           "subject": "ECE",
           "title": "Compiler-1",
           "description": "Compiler",
           "version": "0",
           "isLatest": "true",
           "seq": "0",
           "url": "http://html5videoformatconverter.com/data/images/happyfit2.mp4",
           "dateModified": "1472988819749"
          },
          {
           "id": "a12ab51b04344ce1bccd0d428d6e2c0d",
           "catalog": "351",
           "subject": "ECE",
           "title": "Compiler-2",
           "description": "Compiler",
           "version": "0",
           "isLatest": "true",
           "seq": "0",
           "url": "http://static.videogular.com/assets/videos/videogular.mp4",
           "dateModified": "1472988819749"
          }
        ]
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

    $scope.change_video = function (url) {
      $scope.mediaToggle = {
        sources: [
          {
            src: url,
            type: 'video/mp4'
          },
        ],
        poster: 'images/screen.jpg'
      }
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
        getVideos: {method: 'GET', isArray: true, params: {handle: 'video'}}
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