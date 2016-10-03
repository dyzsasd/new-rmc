define(
['rmc_backbone', 'ext/jquery', 'ext/jqueryui', 'ext/underscore',
'ext/underscore.string', 'ratings', 'ext/select2', 'ext/autosize', 'course',
'user', 'ext/bootstrap', 'prof', 'facebook', 'util', 'ext/toastr'],
function(RmcBackbone, $, _jqueryui, _, _s, ratings, _select2, _autosize,
    _course, _user, _bootstrap, _prof, _facebook, _util, _toastr) {

  // TODO(david): Refactor to use sub-models for reviews
  // TODO(david): Refactor this model to match our mongo UserCourse model
  var UserCourse = RmcBackbone.Model.extend({
    // TODO(mack): use undefined rather than null
    defaults: {
      id: null,
      term_id: null,
      term_name: null,
      course_id: null,
      professor_id: null,
      professor_review: null,
      course_review: null,
      has_reviewed: null
    },

    // Function needed since UserCourses in defined later in file.
    // TODO(david): Use strings for reference field to avoid this fn
    referenceFields: function() {
      return {
        'user': [ 'user_id', _user.UserCollection ],
        'course': [ 'course_id', _course.CourseCollection ],
        'professor': [ 'professor_id', _prof.ProfCollection ]
      };
    },

    url: function() {
      return '/api/user/course';
    },

    initialize: function(attrs) {
      var courseReview = new UserComment(
          attrs ? attrs.course_review : undefined);
      var profReview = new UserComment(
          attrs ? attrs.professor_review : undefined);

      this.set('professor_review', profReview);
      this.set('course_review', courseReview);

      var profRatings = new ratings.RatingChoiceCollection(
          profReview.get('ratings'));
      var courseRatings = new ratings.RatingChoiceCollection(
          courseReview.get('ratings'));

      profReview.set('ratings', profRatings);
      courseReview.set('ratings', courseRatings);

      courseRatings.on('change', _.bind(this.onRatingsChange, this, 'COURSE'));
      profRatings.on('change',
          _.bind(this.onRatingsChange, this, 'PROFESSOR'));

      courseReview.on('change:comment',
          _.bind(this.onCommentsChange, this, 'COURSE'));
      profReview.on('change:comment',
          _.bind(this.onCommentsChange, this, 'PROFESSOR'));

      this.on('sync', _.bind(this.onSync, this));
    },

    // TODO(david): Copied from UserCourseView
    logToGA: function(event, label) {
      _gaq.push([
        '_trackEvent',
        'USER_ENGAGEMENT',
        event,
        label
      ]);
    },

    onDataChange: function(isRatingChange) {
      if (this.isMostlyFilledIn()) {
        this.trigger('mostlyFilledIn', isRatingChange);
      }
    },

    onRatingsChange: function(ratingType) {
      this.save();
      this.onDataChange(true);

      this.logToGA(ratingType, 'RATING');
      mixpanel.track('Reviewing: Save Ratings', {
        rating_type: ratingType,
        course_id: this.get('course_id')
      });
      mixpanel.people.increment({'Rated': 1});
    },

    onCommentsChange: function(reviewType) {
      // TODO(david): Make this fn more consistent with onRatingsChange (which
      //     calls this.save() first. This doesn't because view calls save).
      this.onDataChange(false);

      this.logToGA(reviewType, 'REVIEW');
      mixpanel.track('Reviewing: Save comments', {
        review_type: reviewType,
        course_id: this.get('course_id')
      });
      mixpanel.people.increment({'Reviewed': 1});
    },

    parse: function(attrs) {
      this.get('professor_review').comment_date = attrs[
        'professor_review.comment_date'];
      this.get('course_review').comment_date = attrs[
        'course_review.comment_date'];
      // We return nothing because we have a nested collection which can't be
      // just replaced over because it has event handlers.
      return {};
    },

    onSync: function(model, response, options) {
      this.gainPoints(response.points_gained);
    },

    gainPoints: function(numPoints) {
      this.get('user').gainPoints(numPoints);
    },

    getReviewJson: function(reviewType) {
      var review = this.get(reviewType);
      return _.extend({}, review, {
        'ratings': review.get('ratings').toJSON()
      });
    },

    hasComments: function() {
      // TODO(david): Use date when we fix that on the server
      return this.get('professor_review').comment ||
          this.get('course_review').comment;
    },

    getProgramName: function() {
      return this.get('user').get('program_name');
    },

    getProfName: function() {
      var prof = this.get('professor');
      return prof ? prof.get('name') : '';
    },

    getOverallRating: function() {
      return this.get('course_review').get('ratings').find(function(rating) {
        return rating.get('name') === 'interest';
      });
    },

    promptPostToFacebook: function(reviewType) {
      var name = '';
      var description = '';
      var caption = 'on TK';

      var courseCode = this.get('course').get('code');
      // TODO(Sandy): Turn these into enums or something?
      if (reviewType === 'COURSE') {
        name = 'I reviewed ' + courseCode;
        description = this.get('course_review').get('comment');
      } else if (reviewType === 'PROFESSOR') {
        name = 'I commented on my ' + courseCode + ' professor ' +
            this.getProfName();
        description = this.get('professor_review').get('comment');
      }
      description = _util.truncatePreviewString(description, 50);

      var callback = _.bind(function(response) {
        // response.post_id is returned on success
        // response === null on "Cancel"
        if (response && response.post_id) {
          // TODO(sandy): Award points!
          // Give UI feedback with toastr
          var msg;
          if (reviewType === 'COURSE') {
            msg = _s.sprintf('Shared review for %s on Facebook!',
                this.get('course').get('code'));
          } else if (reviewType === 'PROFESSOR') {
            msg = _s.sprintf('Shared comment on %s for %s on Facebook!',
                this.get('professor').get('name'),
                this.get('course').get('code'));
          }
          _toastr.success(msg);

          this.onShareSuccess(reviewType);

          // Facebook engagement completed
          mixpanel.track('Facebook share review completed', {
            ReviewType: reviewType
          });
          mixpanel.people.increment({'Facebook share review completed': 1});
        }
      }, this);

      // TODO(Sandy): Implement proper review showing, if people actually share
      var link = 'https://tkcourse.com/course/' + this.get('course').get('id');
      _facebook.showFeedDialog({
        link: link,
        name: name,
        caption: caption,
        description: description,
        callback: callback
      });
      // Facebook engagement intent
      mixpanel.track('Facebook share review intent', {
        ReviewType: reviewType
      });
      mixpanel.people.increment({'Facebook share review intent': 1});
    },

    onShareSuccess: function(reviewType) {
      if (reviewType === 'COURSE') {
        reviewType = 'course';
      } else if (reviewType === 'PROFESSOR') {
        reviewType = 'professor';
      }

      var data = {
        user_course_id: this.id,
        review_type: reviewType
      };

      $.ajax('/api/user/course/share', {
        type: 'POST',
        dataType: 'json',
        data: data,
        success: _.bind(this.onShareSuccessResponse, this)
      });
    },

    onShareSuccessResponse: function(response) {
      this.gainPoints(response.points_gained);
    },

    hasTaken: function() {
      return true;//this.has('term_id') &&
          //this.get('term_id') <= window.pageData.currentTermId;
    },

    // TODO(david): Properly determine if user ever has rated/commented by using
    //     date
    // TODO(david): Factor out star into its own Backbone view+model
    hasRatedCourse: function() {
      // TODO(david): Law of demeter-ize this and rest of similar functions
      return this.get('course_review').get('ratings').hasRated();
    },

    hasRatedProf: function() {
      return this.get('professor_review').get('ratings').hasRated();
    },

    hasReviewedCourse: function() {
      return this.get('course_review').get('comment');
    },

    hasReviewedProf: function() {
      return this.get('professor_review').get('comment');
    },

    /**
     *  Is the course model "mostly" filled in? The assumption is that if the
     *  user:
     *    1) rates at least one criterion for both the course and prof
     *    2) reviews both the course and prof
     *  then they probably don't want to give more information and are done.
     * @return {bool} Whether or not the ratings/reviews are "mostly" filled in
     */
    isMostlyFilledIn: function() {
      var courseReview = this.get('course_review');
      var professorReview = this.get('professor_review');

      var hasCourseRating = courseReview.get('ratings').hasRated();
      var hasProfessorRating = professorReview.get('ratings').hasRated();
      var hasCourseReview = !!courseReview.get('comment');
      var hasProfessorReview = !!professorReview.get('comment');

      return hasProfessorRating && hasCourseRating &&
             hasProfessorReview && hasCourseReview;
    }
  });

  var UserCourses = RmcBackbone.Collection.extend({
    model: UserCourse
  });
  UserCourses.registerCache('user_course');

  var CourseCommentView = RmcBackbone.View.extend({
    initialize: function (options) {
      this.course = options.course;
      this.professors = options.professors;
      this.context = options.context;

      this.courseComment = options.courseComment;
      this.profComment = options.profComment;

      this.courseCommentView = new UserCommentView({
        comment: this.courseComment,
        classname: 'user-comment course-comment',
        placeholder: 'Post any tips or comments and earn 50 points!',
        reviewType: 'COURSE'
      });
      this.profCommentView = new UserCommentView({
        review: this.profComment,
        className: 'user-comment prof-comment',
        placeholder: 'Comment about the professor and earn 50 points!',
        reviewType: 'PROFESSOR'
      });

      this.userCourse.on('mostlyFilledIn', _.bind(this.tryAutoScroll, this));

      this.canAutoScroll = !this.userCourse.isMostlyFilledIn();

      this.courseComment.on('change:text',
          _.bind(this.saveComments, this, this.courseCommentView));
      this.profComment.on('change:text',
          _.bind(this.saveComments, this, this.profCommentView));

      this.courseComment.on('change:privacy', _.bind(this.save, this,
          /* attrs */ null, /* options */ null));
      this.profComment.on('change:privacy', _.bind(this.save, this,
          /* attrs */ null, /* options */ null));

      var courseRatings = this.courseComment.getRatings();
      var profRatings = this.profComment.getRatings();

      this.courseRatingsView = new ratings.RatingChoiceCollectionView({
        collection: courseRatings
      });
      this.profRatingsView = new ratings.RatingChoiceCollectionView({
        collection: profRatings
      });

      this.profNames = this.professors.map(function (prof) { return prof.get('name') });
      this.profIds = this.professors.map(function (prof) { return prof.get('id') });

      this.matchesProf = _.bind(function(term) {
        return _.find(this.profNames, _.bind(
            $.fn.select2.defaults.matcher, null, term));
      }, this);
    },

    render: function () {
      var self = this;
      var commentContext = {
        course: this.course.toJSON(),
        user_name: this.context.user.get('name')
      };
      this.$el.html(_.template($('#add-review-tpl').html), commentContext);

      var $profSelect = this.$('.prof-select');
      $profSelect.select2({
        createSearchChoice: function (term) {
          if (self.matchesProf(term)) {
            return null;
          }
          return {
            id: term,
            text: term
          };
        },
        initSelection: function (element, callback) {

        },
        formatNoMatches: function () {
          return 'Type to add new prof'
        },
        allowClear: true,
        data: this.professors.chain().sortBy(function (prof) {
          return prof.get('name');
        }).map(function (prof) {
          return {id: prof.get('id'), text: prof.get('name')};
        }).value()
      });

      if (this.profComment.has('professor_id')) {
        var profId = this.profComment.get('professor_id');
        var prof = this.professors.get(profId);
        if (prof) {
          this.$('.prof-select').select2('data', { id: profId, text: prof.get('name') });
        }
        this.$('.prof-review').show()
      }
      this.$('.course-ratings-placeholder').replaceWith(
          this.courseRatingsView.render().el);
      this.$('.prof-ratings-placeholder').replaceWith(
          this.profRatingsView.render().el);

      this.$('.dropdown-toggle').dropdown();

      return this;
    },

    events: {
      'change .prof-select': 'onProfSelect'
    },

    logToGA: function(event, label) {
      // TODO(Sandy): Include more info like course_id
      // NOTE: The 4th param "value" can ONLY be an integer
      _gaq.push([
        '_trackEvent',
        'USER_ENGAGEMENT',
        event,
        label
      ]);
    },

    onProfSelect: function() {
      var profData = this.$('.prof-select').select2('data');
      if (profData) {
        this.$('.prof-review').slideDown(300, 'easeOutCubic');
      } else {
        this.$('.prof-review').slideUp(300, 'easeOutCubic');
      }
      this.logToGA('PROFESSOR', 'SELECT');
      this.save();

      mixpanel.track('Reviewing: Professor selected', {
        course_id: this.userCourse.get('course_id')
      });
      mixpanel.people.increment({'Professor selected': 1});
    },

    tryAutoScroll: function(isRatingChange) {
      if (isRatingChange &&
          !this.userCourse.get('professor_review').get('ratings').allRated()) {
        return;
      }

      if (this.canAutoScroll) {
        this.$el.trigger('autoScroll', this.courseModel);
        // Only auto scroll once
        this.canAutoScroll = false;
      }
    },

    isMostlyFilledIn: function() {
      var courseReview = this.get('course_review');
      var professorReview = this.get('professor_review');

      var hasCourseRating = courseReview.get('ratings').hasRated();
      var hasProfessorRating = professorReview.get('ratings').hasRated();
      var hasCourseReview = !!courseReview.get('comment');
      var hasProfessorReview = !!professorReview.get('comment');

      return hasProfessorRating && hasCourseRating &&
          hasProfessorReview && hasCourseReview;
    }

  });

  var UserCourseView = RmcBackbone.View.extend({
    initialize: function(options) {
    },

    render: function() {
      var self = this;
      var context = _.extend(this.userCourse.toJSON(), {
        courseModel: this.courseModel.toJSON(),
        program_name: this.userCourse.getProgramName(),
        user_name: this.userCourse.get('user').get('name')
      });
      this.$el.html(_.template($('#add-review-tpl').html(), context));

      this.courseCommentView.setElement(this.$('.course-comment-placeholder')).render();
      this.profCommentView.setElement(this.$('.prof-comment-placeholder')).render();

      // TODO(david): Make this prettier and conform to our styles
      // TODO(david): Show "Add..." option
      var $profSelect = this.$('.prof-select');
      $profSelect.select2({
        createSearchChoice: function(term) {
          // Only create search items if no prefix match
          if (self.matchesProf(term)) {
            return null;
          }
          return {
            id: term,
            text: term
          };
        },
        initSelection : function (element, callback) {
          // Select2 is weird
        },
        formatNoMatches: function(term) {
          return 'Type to add new prof...';
        },
        allowClear: true,
        data: this.courseModel.get('professors')
          .chain()
          .sortBy(function(prof) {
            return prof.get('name');
          })
          .map(function(prof) {
            return { id: prof.id, text: prof.get('name') };
          })
          .value()
      });

      if (this.userCourse.has('professor_id')) {
        var profId = this.userCourse.get('professor_id');
        // TODO(mack): should be looking up prof from prof cache once all pages
        // are refactored to work with prof cache
        var prof = this.courseModel.getProf(profId);
        if (prof) {
          this.$('.prof-select')
            .select2('data', { id: profId, text: prof.get('name') });
        }
        this.$('.prof-review').show();
      }

      this.$('.course-ratings-placeholder').replaceWith(
          this.courseRatingsView.render().el);
      this.$('.prof-ratings-placeholder').replaceWith(
          this.profRatingsView.render().el);

      this.$('.dropdown-toggle').dropdown();

      return this;
    },

    events: {
      'change .prof-select': 'onProfSelect'
    },

    /**
     * Only auto scroll if the user rated all fields for the professor.
     * This heuristic tries to address the case where the user:
     *  1) Reviews the prof
     *  2) Rates the first prof criteria
     *  3) Tries to rate another prof criteria
     * If we don't prevent auto scroll, then 2) will trigger an auto-scroll.
     * We don't consider course ratings because the user is likely done with the
     * course portion by this point.
     * @return {void}
     */
    tryAutoScroll: function(isRatingChange) {
      if (isRatingChange &&
          !this.userCourse.get('professor_review').get('ratings').allRated()) {
        return;
      }

      if (this.canAutoScroll) {
        this.$el.trigger('autoScroll', this.courseModel);
        // Only auto scroll once
        this.canAutoScroll = false;
      }
    },

    logToGA: function(event, label) {
      // TODO(Sandy): Include more info like course_id
      // NOTE: The 4th param "value" can ONLY be an integer
      _gaq.push([
        '_trackEvent',
        'USER_ENGAGEMENT',
        event,
        label
      ]);
    },

    onProfSelect: function() {
      var profData = this.$('.prof-select').select2('data');
      if (profData) {
        this.$('.prof-review').slideDown(300, 'easeOutCubic');
      } else {
        this.$('.prof-review').slideUp(300, 'easeOutCubic');
      }
      this.logToGA('PROFESSOR', 'SELECT');
      this.save();

      mixpanel.track('Reviewing: Professor selected', {
        course_id: this.userCourse.get('course_id')
      });
      mixpanel.people.increment({'Professor selected': 1});
    },

    saveComments: function(view) {
      this.save()
        .done(_.bind(view.saveSuccess, view))
        .error(_.bind(view.saveError, view));
    },

    save: function(attrs, options) {
      var profData = this.$('.prof-select').select2('data');
      var profId = profData && profData.id;
      var newProfAdded = _.contains(this.profIds, profId) ? false : profId;

      return this.userCourse.save(_.extend({
        professor_id: profId,
        new_prof_added: newProfAdded,
        course_id: this.courseModel.get('id')
      }, attrs), options);
    }

  });

  var UserComment = RmcBackbone.Model.extend({
    defaults: {
      comment: '',
      comment_date: null,
      privacy: 'friends'
    }
  });

  var UserCommentView = RmcBackbone.View.extend({
    className: 'user-comment',

    initialize: function(options) {
      this.context = options.context;
      this.comment = options.comment;
      this.placeholder = options.placeholder;
      this.reviewType = options.reviewType;
      this.template = _.template($('#user-comment-tpl').html());
    },

    render: function() {
      this.$el.html(this.template(_.extend(this.review.toJSON(), {
        placeholder: this.placeholder,
        user_name: this.context.get('user').get('name')
      })));

      var $comments = this.$('.comments')
        .autosize({ bottomFeed: 3 })
        .css('resize', 'none');

      _.defer(function() { $comments.trigger('input'); });

      if (this.review.get('text')) {
        this.showShare();
        this.onFocus();
      }

      this.setPrivacy(this.review.get('privacy'));

      return this;
    },

    events: {
      'focus .comments': 'onFocus',
      'click .save-review': 'onSave',
      'click .share-review': 'onShare',
      'input .comments': 'allowSave',
      'click .privacy-tip .dropdown-menu li': 'onPrivacySelect',
    },

    onFocus: function() {
      this.$('.submit-bar').fadeIn(300);
    },

    onSave: function() {
      this.review.set('text', this.$('.comments').val());

      this.$('.save-review')
        .removeClass('btn-primary btn-success')
        .addClass('btn-warning')
        .prop('disabled', true)
        .html('<i class="icon-time"></i> Saving...');

      this.saving = true;
    },

    onShare: function() {
      //TODO: publish to facebook
      //this.userCourse.promptPostToFacebook(this.reviewType);
    },

    allowSave: function() {
      var isChanged = this.review.get('text') != this.$('.comments').val()
      if (this.saving || !this.review.get('text') || !isChanged) {
        return;
      }

      this.$('.share-review')
        .removeClass('share-review')
        .addClass('save-review');

      this.$('.save-review')
        .removeClass('btn-info btn-warning btn-danger')
        .addClass('btn-primary')
        .prop('disabled', false)
        .html('<i class="icon-save"></i> Update!')
        .tooltip('destroy');
    },

    showShare: function() {
      var tooltipText;
      if (this.reviewType === 'COURSE') {
        tooltipText = 'Share this course review to earn 50 points!';
      } else if (this.reviewType === 'PROFESSOR') {
        tooltipText = 'Share this professor review to earn 50 points!';
      }

      this.saving = false;
      this.$('.save-review')
        .removeClass('btn-warning btn-danger btn-primary save-review')
        .addClass('btn-info share-review')
        .prop('disabled', false)
        .html('<i class="icon-share"></i> Share')
        .tooltip({ title: tooltipText });
    },

    saveSuccess: function() {
      this.showShare();
      var msg = '';
      var profName = this.userCourse.get('professor') ?
          this.userCourse.get('professor').get('name') : 'professor';
      var courseCode = this.userCourse.get('course') ?
          this.userCourse.get('course').get('code') : 'course';
      if (this.reviewType === 'COURSE') {
        msg = _s.sprintf('Comments on %s saved!', courseCode);
      } else if (this.reviewType === 'PROFESSOR') {
        msg = _s.sprintf('Comments on %s for %s saved!', profName, courseCode);
      }
      _toastr.success(msg);
    },

    saveError: function() {
      this.saving = false;
      this.$('.save-review')
        .removeClass('btn-warning')
        .addClass('btn-danger')
        .prop('disabled', false)
        .html('<i class="icon-exclamation-sign"></i> ' +
            'Error :( Try again');
    },

    onPrivacySelect: function(evt) {
      var $target = $(evt.currentTarget);
      var setting = $target.data('value');
      this.setPrivacy(setting);
      this.review.set('privacy', setting);
    },

    setPrivacy: function(setting) {
      var html = this.$(
          '.privacy-tip .dropdown-menu [data-value="' + setting + '"] a')
        .html();
      this.$('.current-privacy').html(html);

      var tooltip = {
        everyone: 'Your comments will be public',
        friends: 'Others see "A ' + this.userCourse.getProgramName() +
            ' student"',
        me: 'Post anonymously; no one will know who wrote this.'
      }[setting];

      this.$('.privacy-tip-more-info')
        .tooltip('destroy')
        .tooltip({ title: tooltip });
    }
  });

  var ReviewModalView = RmcBackbone.View.extend({
    el: '#review-modal-container',

    initialize: function(options) {
      this.template = _.template($('#review-modal-tpl').html());

      if (options.courseId) {
        this.initWithCourseId(options.courseId);
      } else {
        this.showNextCourse();
      }

      this.$el.on('show', '.modal', this.onModalShow)
              .on('hide', '.modal', this.onModalHide);
    },

    initWithCourseId: function(courseId) {
      this.courseId = courseId;

      this.courseModel = _course.CourseCollection.getFromCache(courseId);
      this.userCourse = this.courseModel.get('user_course');

      this.userCourseView = new UserCourseView({
        userCourse: this.userCourse,
        courseModel: this.courseModel
      });
      this.reviewStarsView = new ReviewStarsView({
        userCourse: this.userCourse
      });
    },

    render: function() {
      this.$el.html(this.template({
        user: _user.UserCollection.getFromCache(
                window.pageData.profileUserId.$oid),
        course: this.courseModel,
        userCourse: this.userCourse
      }));
      this.$('.user-course-placeholder').replaceWith(
          this.userCourseView.render().el);
      this.$('.review-stars-placeholder').replaceWith(
          this.reviewStarsView.render().el);

      mixpanel.track('Prompt review course', {
        course_id: this.courseModel.get('id')
      });
      mixpanel.people.increment({'Prompted for review': 1});

      return this;
    },

    show: function() {
      this.$('.review-modal').modal('show');
    },

    hide: function() {
      this.$('.review-modal').modal('hide');
    },

    events: {
      'click .btn-review-another': 'onReviewAnotherClick'
    },

    onModalShow: function() {
      $('body').addClass('stop-scrolling');
    },

    onModalHide: function() {
      $('body').removeClass('stop-scrolling');
    },

    onReviewAnotherClick: function() {
      this.hide();
      this.showNextCourse();
    },

    showNextCourse: function() {
      $.getJSON('/api/user/course/to_review', _.bind(function(data) {
        if (data.course_id) {
          this.switchToCourse(data.course_id);
        }
      }, this));
    },

    switchToCourse: function(nextCourseId) {
      // Re-render ourselves with the new course
      this.initWithCourseId(nextCourseId);
      this.render().show();  // TODO(david): Don't hide & show the backdrop
    }
  });

  var ReviewStarsView = RmcBackbone.View.extend({
    className: 'review-stars',

    initialize: function(options) {
      this.template = _.template($('#review-stars-tpl').html());
      this.userCourse = options.userCourse;

      this.userCourse.on('sync', this.onSaveUserReview, this);
    },

    render: function() {
      this.$el.html(this.template({ user_course: this.userCourse }));
      window.setTimeout(_.bind(function() {
        this.$('[title]').tooltip();
      }, this), 2000);
      return this;
    },

    onSaveUserReview: function() {
      // TODO(david): Dedupe this code
      if (this.userCourse.hasRatedCourse()) {
        this.$('.rated-course').addClass('done');
      }
      if (this.userCourse.hasReviewedCourse()) {
        this.$('.reviewed-course').addClass('done');
      }
      if (this.userCourse.hasRatedProf()) {
        this.$('.rated-prof').addClass('done');
      }
      if (this.userCourse.hasReviewedProf()) {
        this.$('.reviewed-prof').addClass('done');
      }
    }
  });

  return {
    UserCourse: UserCourse,
    UserCourses: UserCourses,
    CourseCommentView: CourseCommentView,
    ReviewModalView: ReviewModalView,
    ReviewStarsView: ReviewStarsView
  };
});
