import flask
from flask_jwt import jwt_required, current_identity

import rmc.common.util as util
import rmc.models as m
import rmc.server.view_helpers as view_helpers


api = flask.Blueprint('user_api', __name__, url_prefix='/api/user')

@api.route('/current_user/', methods=['GET'])
@jwt_required()
def get_current_user():
    user = m.User.objects(id=current_identity.id).first()
    if user:
        return util.json_dumps(user.to_dict())
    else:
        flask.abort(404)



@api.route('/remove_course', methods=['POST'])
@view_helpers.login_required
def remove_course():
    current_user = view_helpers.get_current_user()

    rmclogger.log_event(
        rmclogger.LOG_CATEGORY_API,
        rmclogger.LOG_EVENT_REMOVE_COURSE, {
            'request_form': flask.request.form,
            'user_id': current_user.id,
        },
    )

    user_course = m.UserCourse.objects(
        user_id=current_user.id,
        course_id=flask.request.form.get('course_id'),
        term_id=flask.request.form.get('term_id'),
    ).first()

    if not user_course:
        logging.warn("No UserCourse found matching request values %s" %
                flask.request.values)
        # TODO(david): Use api.py:not_found in my onboarding-v2 branch
        return ''

    current_user.update(pull__course_history=user_course.id)

    # Remove calendar items corresponding to the user course
    if not m.Term.is_shortlist_term(user_course.term_id):
        m.UserScheduleItem.objects(
            user_id=current_user.id,
            course_id=user_course.course_id,
            term_id=user_course.term_id,
        ).delete()

    user_course.delete()

    return ''

# XXX[uw](Sandy): Make this not completely fail when hitting this endpoint,
# otherwise the user would have wasted all their work. We can do one of 1. a FB
# login on the client 2. store their data for after they login 3. don't let
# them start writing if they aren't logged in. 1 or 3 seems best
@api.route('/course/', methods=['POST', 'PUT'])
@view_helpers.login_required
def user_course():
    uc_data = util.json_loads(flask.request.data)
    user = view_helpers.get_current_user()

    rmclogger.log_event(
        rmclogger.LOG_CATEGORY_API,
        rmclogger.LOG_EVENT_USER_COURSE, {
            'uc_data': uc_data,
            'user_id': user.id,
        },
    )

    # Validate request object
    course_id = uc_data.get('course_id')
    term_id = uc_data.get('term_id')
    if course_id is None or term_id is None:
        logging.error("/api/user/course got course_id (%s) and term_id (%s)" %
            (course_id, term_id))
        # TODO(david): Perhaps we should have a request error function that
        # returns a 400
        raise exceptions.ImATeapot('No course_id or term_id set')

    # if not m.UserCourse.can_review(term_id):
    #     logging.warning("%s attempted to rate %s in future/shortlist term %s"
    #             % (user.id, course_id, term_id))
    #     raise exceptions.ImATeapot(
    #             "Can't review a course in the future or shortlist")

    # Fetch existing UserCourse
    uc = m.UserCourse.objects(
        user_id=user.id,
        course_id=uc_data['course_id'],
        term_id=uc_data['term_id']
    ).first()

    if uc is None:
        logging.error("/api/user/course User course not found for "
            "user_id=%s course_id=%s term_id=%s" %
            (user.id, course_id, term_id))
        # TODO(david): Perhaps we should have a request error function that
        # returns a 400
        raise exceptions.ImATeapot('No user course found')

    orig_points = uc.num_points

    # TODO(Sandy): Consider the case where the user picked a professor and
    # rates them, but then changes the professor. We need to remove the ratings
    # from the old prof's aggregated ratings and add them to the new prof's
    # Maybe create professor if newly added
    if uc_data.get('new_prof_added'):

        new_prof_name = uc_data['new_prof_added']

        # TODO(mack): should do guess_names first, and use that to
        # generate the id
        prof_id = m.Professor.get_id_from_name(new_prof_name)
        uc.professor_id = prof_id

        # TODO(Sandy): Have some kind of sanity check for professor names.
        # Don't allow ridiculousness like "Santa Claus", "aksnlf",
        # "swear words"
        if m.Professor.objects(id=prof_id).count() == 0:
            first_name, last_name = m.Professor.guess_names(new_prof_name)
            m.Professor(
                id=prof_id,
                first_name=first_name,
                last_name=last_name,
            ).save()

        course = m.Course.objects.with_id(uc.course_id)
        course.professor_ids = list(set(course.professor_ids) | {prof_id})
        course.save()

        logging.info("Added new course professor %s (name: %s)" % (prof_id,
                new_prof_name))
    elif uc_data.get('professor_id'):
        uc.professor_id = uc_data['professor_id']
    else:
        uc.professor_id = None

    now = datetime.now()

    if uc_data.get('course_review'):
        # New course review data
        uc_data['course_review']['comment_date'] = now
        uc.course_review.update(**uc_data['course_review'])

    if uc_data.get('professor_review'):
        # New prof review data
        uc_data['professor_review']['comment_date'] = now
        uc.professor_review.update(**uc_data['professor_review'])

    uc.save()

    points_gained = uc.num_points - orig_points
    user.award_points(points_gained, view_helpers.get_redis_instance())
    user.save()

    return util.json_dumps({
        'professor_review.comment_date': uc['professor_review'][
            'comment_date'],
        'course_review.comment_date': uc['course_review']['comment_date'],
        'points_gained': points_gained,
    })


# TODO(mack): maybe merge this api into /api/user/course/share
@api.route('/course/share', methods=['POST'])
@view_helpers.login_required
def user_course_share():
    user_course_id = flask.request.form['user_course_id']
    review_type = flask.request.form['review_type']
    current_user = view_helpers.get_current_user()

    review = None
    points_gained = 0

    user_course = m.UserCourse.objects.get(
            id=user_course_id, user_id=current_user.id)
    if review_type == 'course':
        review = user_course.course_review
        points_gained = m.PointSource.SHARE_COURSE_REVIEW
    elif review_type == 'professor':
        review = user_course.professor_review
        points_gained = m.PointSource.SHARE_PROFESSOR_REVIEW

    # Only award points on the first share
    if not review.share_date:
        redis = view_helpers.get_redis_instance()
        current_user.award_points(points_gained, redis)
    else:
        points_gained = 0

    review.share_date = datetime.now()
    user_course.save()
    current_user.save()

    return util.json_dumps({
        'points_gained': points_gained,
    })


@api.route('/course/to_review', methods=['GET'])
@view_helpers.login_required
def next_course_to_review():
    current_user = view_helpers.get_current_user()
    uc = current_user.next_course_to_review() if current_user else None
    if not uc:
        return util.json_dumps({})

    uc.select_for_review(current_user)
    return util.json_dumps(uc.to_dict())

@api.route('/schedule_paste', methods=['GET'])
@view_helpers.admin_required
def pasted_schedule_users():
    include_good_paste = bool(flask.request.values.get('include_good_paste'))
    include_bad_paste = bool(flask.request.values.get('include_bad_paste'))

    # Start off with a query that maches no one
    query = me.Q(id__exists=False)
    if include_good_paste:
        query = query | me.Q(last_good_schedule_paste__exists=True)
    if include_bad_paste:
        query = query | me.Q(last_bad_schedule_paste__exists=True)

    users = m.User.objects.filter(query).only('id')
    user_ids = [user.id for user in users]
    print 'num_users', len(user_ids)
    return util.json_dumps({
        'user_ids': user_ids,
    })

@api.route('/last_schedule_paste', methods=['GET'])
# TODO(mack): make this work for logged in user, rather than just admins
@view_helpers.admin_required
def last_schedule_paste():

    user_id = flask.request.values.get('user_id')
    if not user_id:
        user_id = view_helpers.get_current_user().id
    else:
        user_id = bson.ObjectId(user_id)

    user = m.User.objects.with_id(user_id)
    last_schedule_paste = user.last_schedule_paste

    return util.json_dumps({
        'last_schedule_paste': last_schedule_paste,
    })

