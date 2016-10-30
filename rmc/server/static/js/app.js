angular.module('RmcUI', [
  'ngAnimate',
  'ngCookies',
  'ngRoute',
  'ui.bootstrap',
  'RmcUI.course',
  'RmcUI.course-overview',
  'RmcUI.courseslist',
  'RmcUI.index',
  'RmcUtils'
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

.config(['$httpProvider', function ($httpProvider) {
  $httpProvider.interceptors.push('authInterceptor');
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

.controller('NavCtrl', ['$scope', '$http', '$location', '$route',
  '$modal', '$window', 'UserClient', 'CurrentUser', 'FBAuth',
  function ($scope, $http, $location, $route, $modal, $window, UserClient, CurrentUser, FBAuth) {

  $scope.isAuthenticated = false;

  UserClient.current_user({}).$promise.then(function (response) {
    if (response.status_code !== 401) {
      CurrentUser['user'] = response;
      $scope.isAuthenticated = true;
    } else {
      $scope.isAuthenticated = false;
      CurrentUser['user'] = undefined;
    }
  });

  $scope.logout = function () {
    $window.localStorage.removeItem('accessToken');
    $window.location.reload();
  };

  $scope.navButtonClass = function (href) {
    if (href === $location.url())
      return "active";
    else
      return "";
  };

  $scope.login = function () {
    $modal.open({
      animation: true,
      templateUrl: '/login.html',
      windowClass: 'center-modal',
      size: 'lg',
      controller: ['$scope', '$modalInstance', 'AuthService',
        function (scope, $modalInstance, AuthService) {
          scope.credentials = {};
          scope.error_message = "";
          scope.login = function (credentials) {
            AuthService
              .login(credentials)
              .then(function (response) {
                if (response.status === 200) {
                  $window.location.reload();
                } else {
                  scope.error_message = response.data.description;
                }
              }, function (err) {
                  scope.error_message = err.data.description;
              })
          }
          scope.fbLogin = function () {
            FBAuth.login();
          }
        }]
    });
  };

  $scope.registration = function () {
    $modal.open({
      animation: true,
      templateUrl: '/registration.html',
      windowClass: 'center-modal',
      size: 'lg',
      controller: ['$scope', 'AuthService',
        function (scope, AuthService) {
          scope.user = {};
          scope.error_message = "";
          scope.signup = function (user) {
            $http.post('/signup', user).then(
              function (response) {
                if (response.status === 200) {
                  return AuthService.login({
                    email: user.email,
                    password: user.password
                  });
                }
              }, function (err) {
                scope.error_message = err.data.description;
              }
            ).then(function (response) {
                if (response && response.status_code === 200) {
                  $window.location.reload();
                } else if (response === undefined) {
                  scope.error_message = "email already used";
                } else {
                  scope.error_message = response.data.description;
                }
              }, function (err) {
                scope.error_message = err.data.description;
              }
            )
          };

        }]
    });
  };

}])

.factory('FBAuth', ['$window', function ($window) {
  var fbApi = {}
  $window.FB.init({
    appId      : '119055615212269',
    cookie     : true,
    xfbml      : true,
    status     : true,
    version    : 'v2.5'
  });

  fbApi.login = function () {
    $window.FB.api('/me', function(response) {
      console.log('Successful login for: ' + response.name);
      console.log(response)
    })
  };
  return fbApi;
}])

.factory('UserClient', ['$resource', function ($resource) {
  return $resource (
      'api/user/current_user/',
      {},
      {
        current_user: {method: 'GET', isArray: false}
      }
  )}])

.factory('AuthService', ['$http', '$window', function($http, $window) {
  var authService = {};

  authService.login = function(credentials) {
    return $http.post('/auth', credentials).then(function(res) {
      $window.localStorage.setItem('accessToken', res.data.access_token);
      return res;
    });
  };

  authService.isAuthenticated = function() {
    return !!$window.localStorage.get('accessToken');
  };

  return authService;
}])

.factory('authInterceptor', [ '$q', '$location', '$window',
  function ($q, $location, $window) {
    return {
      'request': function (config) {
        if ($window.localStorage.getItem('accessToken')) {
          config.headers.Authorization = 'JWT ' + $window.localStorage.getItem('accessToken');
        }
        return config || $q.when(config);
      },
      'responseError': function (response) {
        if (response.status === 401) {
          $window.localStorage.removeItem('accessToken');
        }
        return response || $q.when(response);
      }
    }
  }])

.run(['$http', '$cookies',
  function ($http, $cookies) {
    $http.defaults.headers.common['_csrf_token'] = $cookies.csrftoken;
}]);