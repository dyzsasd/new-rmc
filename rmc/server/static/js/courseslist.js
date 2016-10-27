angular.module('RmcUI.courseslist', ['ngResource'])

  .controller('CourseslistCtrl', ['$scope', '$location', '$routeParams', '$timeout', 'SearchClient',
    function ($scope, $location, $routeParams, $timeout, SearchClient) {
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
          $scope.courseCollection.push(course);
        });
      }

      function updateCourses(offset) {
        SearchClient.find({
          offset: offset,
          count: 10,
          keyword: $scope.query
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
            $location.search('query', newQuery || null);
          }, delayInMs);
        }
      }, true);

      $scope.courseDetailSwitch = function (course) {
        course.showDetail = !course.showDetail;
      };

      $scope.loadMore = function () {
        updateCourses($scope.courseCollection.length);
      };
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
