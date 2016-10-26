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
    templateUrl: 'template/index.html',
    controller: 'IndexCtrl'
  });
  $routeProvider.when('/course', {
    templateUrl: 'template/courseslist.html',
    controller: 'CourseslistCtrl'
  });
  $routeProvider.when('/course/:id', {
    templateUrl: 'template/course-overview.html',
    controller: 'CourseOverviewCtrl'
  });
  $routeProvider.when('/course/:id/video', {
    templateUrl: 'template/course.html',
    controller: 'CourseCtrl'
  });
  $routeProvider.otherwise({redirectTo: '/'});
}])

.run(['$http', '$cookies', function ($http, $cookies) {
  $http.defaults.headers.common['X-CSRFToken'] = $cookies.csrftoken;
}]);