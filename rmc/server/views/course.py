import flask

import rmc.common.rmclogger as rmclogger
import rmc.models as m
import rmc.server.view_helpers as view_helpers


view = flask.Blueprint('course_view', __name__, url_prefix='/course')


@view.route('/')
def course():
    # TODO(mack): move into COURSES_SORT_MODES
    def clean_sort_modes(sort_mode):
        return {
            'name': sort_mode['name'],
            'direction': sort_mode['direction'],
        }

    sort_modes = map(clean_sort_modes, m.Course.SORT_MODES)

    current_user = view_helpers.get_current_user()

    # Don't show friends_taken sort mode when user has no friends
    if current_user and len(current_user.friend_ids) == 0:
        sort_modes = [sm for sm in sort_modes if sm['name'] != 'friends_taken']

    return flask.render_template(
        'search_page.html',
        page_script='search_page.js',
        sort_modes=sort_modes,
        current_user_id=current_user.id if current_user else None,
        user_objs=[current_user.to_dict(
            include_course_ids=True)] if current_user else [],
    )


@view.route('/<string:course_id>')
def course_page(course_id):
    course = m.Course.objects.with_id(course_id)
    if not course:
        # TODO(david): 404 page
        flask.abort(404)

    current_user = view_helpers.get_current_user()

    course_obj = course.to_dict()

    rmclogger.log_event(
        rmclogger.LOG_CATEGORY_IMPRESSION,
        rmclogger.LOG_EVENT_SINGLE_COURSE, {
            'current_user': current_user.id if current_user else None,
            'course_id': course_id,
        },
    )

    return flask.render_template('course_page.html',
        page_script='course_page.js',
        course_obj=course_obj
    )

