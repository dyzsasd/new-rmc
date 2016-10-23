define(
['rmc_backbone', 'ext/jquery', 'ext/underscore', 'ext/underscore.string',
'course', 'ratings', 'ext/bootstrap', 'util', 'jquery.slide', 'prof', 'ext/toastr',
'section', 'work_queue', 'sign_in'],
function(RmcBackbone, $, _, _s, course, ratings, __, util, jqSlide, _prof, toastr,
_section, _work_queue, sign_in) {

  var CourseComment = RmcBackbone.Model.extend({
    urlRoot: '/api/comment/',
    defaults: {
      user_id: undefined,
      course_id: undefined,
      text: undefined,
      created_at: undefined,
      last_updated_at: undefined,
      shared_at: undefined,
      rating_updated_at: undefined,
      privacy: undefined,
      choices: undefined,
      num_voted_helpful: undefined,
      num_voted_not_helpful: undefined,
      interest: undefined,
      easiness: undefined,
      usefulness: undefined
    },
    initialize: function () {
      _.bindAll(this, "update");
    },
    update: function () {
      console.log("course comment model should be updated")
    },
    getOrCreate: function () {
      return this.fetch({
        data: $.param({
          course_id: this.get('course_id')
        })
      });
    },
    getRatings: function () {
      var easiness = new ratings.RatingModel({
        name: 'easiness',
        rating: this.get('easiness')
      });
      var interest = new ratings.RatingModel({
        name: 'interest',
        rating: this.get('interest')
      });
      var usefulness = new ratings.RatingModel({
        name: 'usefulness',
        rating: this.get('usefulness')
      });
      return new ratings.RatingCollection([easiness, interest, usefulness]);
    }
  });

  var CourseProfComment = RmcBackbone.Model.extend({
    urlRoot: '/api/comment/prof/',
    defaults: {
      user_id: undefined,
      course_id: undefined,
      professor_id: undefined,
      text: undefined,
      created_at: undefined,
      last_updated_at: undefined,
      shared_at: undefined,
      rating_updated_at: undefined,
      privacy: undefined,
      choices: undefined,
      num_voted_helpful: undefined,
      num_voted_not_helpful: undefined,
      clarity: undefined,
      passion: undefined,
      isInitialized: false
    },
    initialize: function () {
      this.on('change', this.update);
    },
    update: function () {
      var shouldUpdate = (
        this.get('isInitialized')
        && this.previous('isInitialized')
        && (this.previous('course_id') !== undefined)
      );
      if (shouldUpdate) {
        this.save(this.attribute, {success: this.postSave})
      }
    },
    postSave: function (response) {
      var self = this;
      console.log(self);
      if (!self.id) {
        self.set('id', response['id']);
      }
    },
    getOrCreate: function () {
      var self = this;
      return this.fetch({
        data: $.param({
          course_id: this.get('course_id')
        })
      }).then(function (response) {
        self.set('isInitialized', true);
        return response;
      });
    },
    getRatings: function () {
      var clarity = new ratings.RatingModel({
        name: 'clarity',
        rating: this.get('clarity')
      });
      var passion = new ratings.RatingModel({
        name: 'passion',
        rating: this.get('passion')
      });
      return new ratings.RatingCollection([clarity, passion]);
    }
  });

  var EditableCommentView = RmcBackbone.View.extend({
    initialize: function (options) {
      this.course = options.course;
      this.courseComment = options.courseComment;
      this.courseProfComment = options.courseProfComment;
      this.profCollection = options.profCollection;

      this.courseCommentView = new EditableCommentTextView({
        comment: this.courseComment,
        classname: 'user-comment course-comment',
        placeholder: 'Post any tips or comments and earn 50 points!',
        reviewType: 'COURSE'
      });
      this.profCommentView = new EditableCommentTextView({
        comment: this.courseProfComment,
        className: 'user-comment prof-comment',
        placeholder: 'Comment about the professor and earn 50 points!',
        reviewType: 'PROFESSOR'
      });

      var courseRatings = this.courseComment.getRatings();
      var profRatings = this.courseProfComment.getRatings();

      this.courseRatingsView = new ratings.RatingChoiceCollectionView({
        collection: courseRatings
      });
      this.profRatingsView = new ratings.RatingChoiceCollectionView({
        collection: profRatings
      });

      this.profNames = this.profCollection.map(function (prof) { return prof.get('name') });
      this.profIds = this.profCollection.map(function (prof) { return prof.get('id') });
      this.matchesProf = _.bind(function(term) {
        return _.find(this.profNames, _.bind(
          $.fn.select2.defaults.matcher, null, term));
      }, this);
      this.template = _.template($('#add-review-tpl').html());
    },

    render: function () {
      var self = this;
      this.$el.html(this.template, {});

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
        data: this.profCollection.chain().sortBy(function (prof) {
          return prof.get('name');
        }).map(function (prof) {
          return {id: prof.get('id'), text: prof.get('name')};
        }).value()
      });

      if (this.courseProfComment.has('professor_id')) {
        var profId = this.courseProfComment.get('professor_id');
        var prof = this.profCollection.get(profId);
        if (prof) {
          this.$('.prof-select').select2('data', { id: profId, text: prof.get('name') });
        }
        this.$('.prof-review').show()
      }

      this.courseCommentView.setElement(this.$('.course-comment-placeholder')).render();
      this.profCommentView.setElement(this.$('.prof-comment-placeholder')).render();

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
      this.courseProfComment.set('professor_id', profData['id']);
      this.logToGA('PROFESSOR', 'SELECT');
      console.log(this.course)
      mixpanel.track('Reviewing: Professor selected', {
        course_id: this.course.id
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

  var EditableCommentTextView = RmcBackbone.View.extend({
    className: 'user-comment',

    initialize: function(options) {
      this.comment = options.comment;
      this.placeholder = options.placeholder;
      this.reviewType = options.reviewType;
      this.template = _.template($('#user-comment-tpl').html());
    },

    render: function() {
      this.$el.html(this.template(_.extend(this.comment.toJSON(), {
        placeholder: this.placeholder
      })));

      var $comments = this.$('.comments')
        .autosize({ bottomFeed: 3 })
        .css('resize', 'none');

      _.defer(function() { $comments.trigger('input'); });

      if (this.comment.get('text')) {
        this.showShare();
        this.onFocus();
      }

      this.setPrivacy(this.comment.get('privacy'));

      return this;
    },

    events: {
      'focus .comments': 'onFocus',
      'click .save-review': 'onSave',
      'click .share-review': 'onShare',
      'input .comments': 'allowSave',
      'click .privacy-tip .dropdown-menu li': 'onPrivacySelect'
    },

    onFocus: function() {
      this.$('.submit-bar').fadeIn(300);
    },

    onSave: function() {
      this.comment.set('text', this.$('.comments').val());

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
      var isChanged = this.comment.get('text') != this.$('.comments').val();
      if (this.saving || !this.comment.get('text') || !isChanged) {
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
        everyone: 'Your comments will be public.',
        friends: 'Your comments will be seen by your friends.',
        me: 'Post anonymously; no one will know who wrote this.'
      }[setting];

      this.$('.privacy-tip-more-info')
        .tooltip('destroy')
        .tooltip({ title: tooltip });
    }
  });

  var CommentTextView = RmcBackbone.View.extend({
    className: 'comment',

    initialize: function() {
      this.template = _.template($('#post-comment-tpl').html());
    },

    render: function() {
      this.$el.html(this.template(this.model.toJSON()));
      return this;
    }
  });

  var CommentDisplayView = RmcBackbone.View.extend({
    className: 'review-post',

    initialize: function(options) {
      this.commentTextView = new CommentTextView({ model: this.model });
      this.template = _.template($('#review-tpl').html());
    },

    render: function() {
      this.$el.html(this.template({}));
      this.$('.comment-placeholder').replaceWith(this.commentTextView.render().el);
      return this;
    }
  });

  var CommentCollection = RmcBackbone.Collection.extend({
    model: CourseComment,
    url: '/api/comment/comments/',
    hasMore: true,
    start: 0,
    rows: 6,
    initialize: function (options) {
      this.course_id = options.course_id;
    },
    count: function () {
      return this.fetch({
        data: $.param({
          course_id: this.course_id
        }),
        url: this.url + 'count/'
      })
    },
    load: function () {
      var batchRows = this.rows;
      var batchStart = this.start;
      var commentCollections = this;
      return this.fetch({
        data: $.param({
          course_id: this.course_id,
          rows: batchRows,
          start: batchStart
        })
      }).then(function (response) {
        console.log(response);
        if (response.length < batchRows) {
          commentCollections.hasMore = false;
        }
        commentCollections.start = commentCollections.start + response.length;
        return response;
      })
    }
  });

  var CommentCollectionView = RmcBackbone.CollectionView.extend({
    className: 'tips-collection',

    createItemView: function(model) {
      return new CommentDisplayView({ model: model });
    }
  });

  var CommentCollectionExpandableView = RmcBackbone.View.extend({
    className: 'all-tips',
    canExpanded: true,

    events: {
      'click .toggle-tips': 'toggleExpand'
    },

    initialize: function(options) {
      this.comments = options.comments;
      console.log(this.comments.hasMore)
      this.title = "Course Comments";
      this.course = null;
      // Possible pageType values are 'prof' and 'course'
      this.pageType = options.pageType;
      options = options || {};
      if (this.pageType === 'prof') {
        this.title = options.course.id.toUpperCase();
        this.course = options.course;
      } else if (this.pageType === 'course') {
        this.title = options.course.id.toUpperCase();
        this.course = options.course;
      }
      this.template = _.template($('#expandable-comment-collection-tpl').html());
    },

    generateView: function () {
      var commentCollectionView = new CommentCollectionView({
        collection: this.comments
      });
      var renderedComments = commentCollectionView.render().$el;
      var expandFooter = '<div class="tips-collection-placeholder"></div>';
      return renderedComments.add(expandFooter)
    },

    render: function() {
      this.$el.html(this.template({
        title: this.title
      }));
      if (this.pageType === 'prof') {
        this.courses = new course.CourseCollection([this.course]);
        var courseCollectionView = new course.CourseCollectionView({
          courses: this.courses,
          canShowAddReview: true
        });
        this.$('.tip-title').replaceWith(courseCollectionView.render().$el);
      } else {
        this.$('.tip-title').text("Course Comments");
      }

      this.$('.tips-collection-placeholder').replaceWith(this.generateView());
      if (this.pageType === 'prof') {
        this.$('.review-post').wrapAll('<div class="expanded-tips hide-initial">');
      }

      return this;
    },

    toggleExpand: function() {
      if (this.canExpanded) {
        this.canExpanded = false;
        var commentCollection = this.comments;
        var commentCollectionView = this;

        this.comments.load().then(function (response) {
          commentCollectionView.$('.expanded-tips').fancySlide('up');
          commentCollectionView
            .$('.tips-collection-placeholder')
            .replaceWith(commentCollectionView.generateView());
          console.log(commentCollection.hasMore)
          if (commentCollection.hasMore) {
            commentCollectionView.canExpanded = true;
          } else {
            commentCollectionView.$('.expanded-tips').fancySlide('down');
            commentCollectionView.$('.toggle-tips').html('&laquo; no more reviews');
            commentCollectionView.canExpanded = false;
          }
        });
      }
    }
  });

  return {
    CourseComment: CourseComment,
    CourseProfComment: CourseProfComment,
    EditableCommentView: EditableCommentView,
    CommentDisplayView: CommentDisplayView,
    CommentCollection: CommentCollection,
    CommentCollectionView: CommentCollectionView,
    CommentCollectionExpandableView: CommentCollectionExpandableView
  };
}
);