angular.module('RmcUI.courseslist', ['ngResource', 'RmcUtils'])

  .controller('CourseslistCtrl', [
    '$scope', '$rootScope', '$routeParams', '$timeout', 'SearchClient', 'CurrentUser',
    function ($scope, $rootScope, $routeParams, $timeout, SearchClient, CurrentUser) {
      $scope.courseCollection = [];
      var hasMore = true;
      $scope.query = $routeParams.query || '';

      function init() {
        $scope.courseCollection = [];
        hasMore = true
      }

      init();

      function updateCourse(courses) {
        angular.forEach(courses, function (course) {
          course.showDetail = false;
        });
        $scope.courseCollection = $scope.courseCollection.concat(courses);
      }

      function updateCourses(offset) {
        SearchClient.find({
          offset: offset,
          count: 10,
          keywords: $scope.query
        }).$promise
          .then(function (response) {
            if (response.length !== 0) {
              updateCourse(response['course_objs']);
              $scope.courseCount = $scope.courseCollection.length;
              $scope.hasMore = response['has_more'];
            }
          }, function (error) {
            console.log(error)
          });
      }

      updateCourses($scope.courseCollection.length);

      var timeoutPromise;
      var delayInMs = 500;
      $scope.$watch("query", function (newQuery, oldQuery) {
        $timeout.cancel(timeoutPromise);
        if (newQuery !== oldQuery && oldQuery !== undefined && newQuery !== undefined) {
          timeoutPromise = $timeout(function () {
            init();
            updateCourses($scope.courseCollection.length);
          }, delayInMs);
        }
      }, true);

      $scope.courseDetailSwitch = function (course) {
        course.showDetail = !course.showDetail;
      };

      $scope.loadMore = function () {
        updateCourses($scope.courseCollection.length);
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

    }])

  .factory('SearchClient', ['$resource', function ($resource) {
    return $resource (
      'api/course/search',
      {},
      {
        find: {method: 'GET', isArray: false}
      }
    )}])

  .filter('RatingLabel', [function () {
    return function (rating) {
      if (rating.count === 0)
        return 'unkown';
      else
        return rating.rating;
    };
  }]);
