angular.module('RmcUI.course-overview', [])

  .controller('CourseOverviewCtrl', ['$scope', '$routeParams', 'Course',
    function ($scope, $routeParams, Course) {
      var course_id = $routeParams.course_id;
      $scope.course = {};

      Course.get({couse_id: course_id}).$promise
        .then(function (response) {
          $scope.course = response;
        }, function (error) {
          console.log(error)
        });

      comments = [];



    }])

  .factory('Comment', ['$resource', function ($resource) {
    return $resource (
      '/api/comments/',
      {},
      {
        get: {method: 'GET', isArray: false, id: null}
      }

    )}])

  .factory('Course', ['$resource', function ($resource) {
    return $resource (
      '/api/course/get/:couse_id',
      {},
      {
        get: {method: 'GET', isArray: false}
      }

  )}]);