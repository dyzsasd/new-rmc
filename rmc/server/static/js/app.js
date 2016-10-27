angular.module('RmcUI', [
  'ngAnimate',
  'ngCookies',
  'ngRoute',
  'RmcUI.course',
  'RmcUI.course-overview',
  'RmcUI.courseslist',
  'RmcUI.index'
])

.config(['$animateProvider', function ($animateProvider) {
  /*jslint regexp: true*/
  $animateProvider.classNameFilter(/^((?!(fa-spinner)).)*$/);
  /*jslint regexp: false*/
}])

.config(['$locationProvider', function ($locationProvider) {
  $locationProvider.html5Mode({
    enabled: true,
    requireBase: false
  }).hashPrefix('!');
}])

.config(['$routeProvider', function ($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: '/static/partials/index.html',
    controller: 'IndexCtrl'
  });
  $routeProvider.when('/course', {
    templateUrl: '/static/partials/courseslist.html',
    controller: 'CourseslistCtrl'
  });
  $routeProvider.when('/course/:course_id', {
    templateUrl: '/static/partials/course-overview.html',
    controller: 'CourseOverviewCtrl'
  });
  $routeProvider.when('/course/:course_id/video', {
    templateUrl: '/static/partials/course.html',
    controller: 'CourseCtrl'
  });
  $routeProvider.otherwise({redirectTo: '/'});
}])

.controller('NavCtrl', ['$scope', '$location', function ($scope, $location) {
  $scope.navButtonClass = function (href) {
    if (href === $location.url())
      return "active";
    else
      return "";
  };
}])

.run(['$http', '$cookies', function ($http, $cookies) {
  $http.defaults.headers.common['X-CSRFToken'] = $cookies.csrftoken;
}]);