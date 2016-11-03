angular.module('RmcUI.course-overview', [])

  .controller('CourseOverviewCtrl', [
    '$scope', '$modal', '$routeParams', 'Course', 'Comment', 'ProfComment', 'Prof',
    function ($scope, $modal, $routeParams, Course, Comment, ProfComment, Prof) {

      $scope.addingReview = false;

      var course_id = $routeParams.course_id;

      $scope.course = {};
      $scope.courseComment = {};
      $scope.courseProfComment = {};
      $scope.profs = [];
      $scope.comments = [];

      $scope.hasMore = true;

      Course.get({course_id: course_id}).$promise
        .then(function (response) {
          console.log('course:', response)
          $scope.course = response;
          return Comment.getOwnComment({course_id: course_id}).$promise;
        })
        .then(function (response) {
          $scope.courseComment = response;
          if (!$scope.courseComment.interest)
            $scope.courseComment.interest = 2.5
          else
            $scope.courseComment.interest = $scope.courseComment.interest * 5
          if (!$scope.courseComment.easiness)
            $scope.courseComment.easiness = 2.5
          else
            $scope.courseComment.easiness = $scope.courseComment.easiness * 5
          if (!$scope.courseComment.usefulness)
            $scope.courseComment.usefulness = 2.5
          else
            $scope.courseComment.usefulness = $scope.courseComment.usefulness * 5
          console.log('courseComment:', response)
          return ProfComment.getOwnComment({course_id: course_id}).$promise;
        })
        .then(function (response) {
          $scope.courseProfComment = response;
          console.log('profComment:', response)
          if (!$scope.courseProfComment.clarity)
            $scope.courseProfComment.clarity = 2.5
          else
            $scope.courseProfComment.clarity = $scope.courseProfComment.clarity * 5
          if (!$scope.courseProfComment.passion)
            $scope.courseProfComment.passion = 2.5
          else
            $scope.courseProfComment.passion = $scope.courseProfComment.passion * 5
          return Prof.getProfs({'prof_id[]': $scope.course.professor_ids}).$promise
        })
        .then(function (response) {
          console.log('profs: ', response)
          $scope.profs = response;
        })

      function loadComments() {
        Comment.getCommentList({
          course_id: course_id,
          start: $scope.comments.length,
          rows: 100
        })
          .$promise
          .then(function (response) {
            $scope.comments = $scope.comments.concat(response);
            if (response.length < 100)
              $scope.hasMore = false
          });
      }

      loadComments();

      $scope.openAddReview = function (runId) {
        $modal.open({
          animation: true,
          templateUrl: '/course/add_review.html',
          windowClass: 'center-modal',
          size: 'lg',
          resolve: {
            courseComment: function () {
              return $scope.courseComment;
            },
            courseProfComment: function () {
              return $scope.courseProfComment;
            },
            profs: function () {
              return $scope.profs;
            }
          },
          controller: [
            '$scope', 'courseComment', 'courseProfComment', 'profs',
            function (scope, courseComment, courseProfComment, profs) {
              scope.courseComment = courseComment;
              scope.courseProfComment = courseProfComment;
              scope.profs = profs;
              scope.addReview = function (courseComment, courseProfComment) {
                var message = angular.copy(courseComment);
                message.interest = courseComment.interest / 5;
                message.usefulness = courseComment.usefulness / 5;
                message.easiness = courseComment.easiness / 5;
                Comment.saveComment(message);
              }
            }]
        });
      };

    }])

  .factory('Comment', ['$resource', function ($resource) {
    return $resource (
      '/api/comment/:handle/',
      {},
      {
        getCommentList: {method: 'GET', isArray: true, params: {handle: 'comments'}},
        getOwnComment: {method: 'GET', isArray: false, params: {handle: 'get'}},
        saveComment: {method: 'PUT', isArray: false, params: {handle: 'save'}}
      }

    )}])

  .factory('ProfComment', ['$resource', function ($resource) {
      return $resource (
        '/api/comment/prof/:handle/',
        {},
        {
          getOwnComment: {method: 'GET', isArray: false, params: {handle: 'get'}}
        }
    )}])

  .factory('Prof', ['$resource', function ($resource) {
      return $resource (
        '/api/prof/:handle/',
        {},
        {
          getProfs: {method: 'GET', isArray: true, params: {handle: 'collection'}}
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
