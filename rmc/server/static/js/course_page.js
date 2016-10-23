require(
['ext/jquery','comment', 'course', 'took_this', 'user', 'tips', 'prof', 'exam', 'ratings',
'user_course', 'review', 'sign_in', 'section'],
function($, _comment, course, tookThis, user, tips, prof, _exam, ratings, user_course,
    _review, _sign_in, _section) {

  var course_id = window.location.pathname.split('/').slice(-1)[0];
  var courseObj = new course.Course({id: course_id});
  var comments = new _comment.CommentCollection({course_id: course_id});
  var courseComment = new _comment.CourseComment({ course_id: course_id});
  var courseProfComment = new _comment.CourseProfComment({ course_id: course_id});
  var profCollection = new prof.ProfCollection();

  courseObj.fetch().then(function () {
    var ratingsView = new ratings.RatingsView({
      ratings: courseObj.getRatings(),
      subject: 'course'
    });
    console.log(courseObj);

    $('.ratings-placeholder').replaceWith(
      ratingsView.render().el
    );
    var profIds = courseObj.get('professor_ids') || [];
    var profQueryParas = [];
    profIds.forEach(function (id) {
      profQueryParas.push({name: 'prof_id', value: id})
    });
    return profCollection.fetch({
      data: $.param(profQueryParas)
    });
  }).then(function () {
    console.log(profCollection);
    return comments.count();
  }).then(function (response) {
    $('#comments-count').html(response);
    return comments.load();
  }).then(function () {
    if (comments.length) {
      var commentsView = new _comment.CommentCollectionExpandableView({
        comments: comments,
        course: courseObj,
        pageType: 'course'
      });
      $('#tips-collection-container').replaceWith(commentsView.render().el)
    }
    return courseComment.getOrCreate();
  }).then(function () {
    return courseProfComment.getOrCreate();
  }).then(function () {
    var editableCommentView = new _comment.EditableCommentView({
      course: courseObj,
      courseComment: courseComment,
      courseProfComment: courseProfComment,
      profCollection: profCollection
    });
    $('.review-placeholder').replaceWith(editableCommentView.render().el);
  });


/*course.CourseCollection.addToCache(courseObj);
  user_course.UserCourses.addToCache(pageData.userCourseObjs);
  prof.ProfCollection.addToCache(pageData.professorObjs);

  /*var courseModel = course.CourseCollection.getFromCache(courseObj.id);
  var userCourse = courseModel.get('user_course');

  var overallRating = courseModel.getOverallRating();
  var ratingBoxView = new ratings.RatingBoxView({ model: overallRating });
  $('#rating-box-container').html(ratingBoxView.render().el);
*/
/*
  var courseInnerView = new course.CourseInnerView({
    courseModel: courseModel,
    userCourse: userCourse,
    shouldLinkifySectionProfs: true
  });

  $('#course-inner-container').html(courseInnerView.render().el);
    courseInnerView.animateBars();

  $('.ratings-placeholder').replaceWith(
    courseInnerView.ratingsView.render().el
  );

  if (courseInnerView.userCourseView) {
    $('.review-placeholder').replaceWith(
      courseInnerView.userCourseView.render().el);
  }

  if (courseModel.has('sections')) {
    var sectionCollectionView = new _section.SectionCollectionView({
      collection: courseModel.get('sections'),
      shouldLinkifyProfs: true
    });
    if (sectionCollectionView) {
      $('.section-collection-placeholder').replaceWith(
        sectionCollectionView.render().el);
    }
  }

  if (window.pageData.examObjs.length) {
    var examCollection = new _exam.ExamCollection(window.pageData.examObjs);

    // Only show this "final exams" section if there are actually exams taking
    // place in the future
    if (examCollection.latestExam().get('end_date') >= new Date()) {
      var examSchedule = new _exam.ExamSchedule({
        exams: examCollection,
        last_updated_date: window.pageData.examUpdatedDate
      });
      var courseExamScheduleView = new _exam.CourseExamScheduleView({
        examSchedule: examSchedule
      });

      $('#exam-info-container')
        .html(courseExamScheduleView.render().el)
        .show();
    }
  }

  var tookThisSidebarView = new tookThis.TookThisSidebarView({
    userCourses: courseModel.get('friend_user_courses'),
    courseCode: courseModel.get('code'),
    currentTermId: window.pageData.currentTermId
  });
  $('#took-this-sidebar-container').html(tookThisSidebarView.render().el);

  if (window.pageData.tipObjs && pageData.tipObjs.length) {
    var tipsCollection = new _review.ReviewCollection(window.pageData.tipObjs);
    var tipsView = new tips.ExpandableTipsView({
      reviews: tipsCollection,
      pageType: 'course'
    });
    $('#tips-collection-container').replaceWith(tipsView.render().el);
  }

  // TODO(david): Handle no professors for course
  var profsCollection = courseModel.get('professors');
  var profsView = new prof.ProfCollectionView({ collection: profsCollection });
  $('#professor-review-container').html(profsView.render().el);

  if (!window.pageData.currentUserId) {
    _sign_in.renderBanner({
      source: 'BANNER_COURSE_PAGE',
      nextUrl: window.location.href
    });
  }
  
  $('.rating-number').html((overallRating.get('rating') * 5).toFixed(1));
  var orating = overallRating.get('rating') * 500;
  $('.all-ratings-box .progress').each(function(i, elem) {
    var percent = orating - (100 * i);
    $(elem).find('.bar').css('width', ((percent<100)?(percent):(100)) + '%');
  });

  mixpanel.track('Impression: Single course page');

  $(document.body).trigger('pageScriptComplete');*/
});
