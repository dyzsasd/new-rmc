import flask

import rmc.common.util as util
import rmc.models as m
import rmc.server.view_helpers as view_helpers


api = flask.Blueprint('course_api', __name__, url_prefix='/api/course')


@api.route('/get/<string:course_id>', methods=['GET'])
def get_courses(course_id):
    course_id = course_id.lower()
    course = m.Course.objects(id=course_id).first()

    if course is None:
        return flask.abort(404)
    else:
        return util.json_dumps(course.to_dict())


@api.route('/search', methods=['GET'])
# TODO(mack): find a better name for function
# TODO(mack): a potential problem with a bunch of the sort modes is if the
# value they are sorting by changes in the objects. this can lead to missing
# or duplicate contests being passed to front end
def search_courses():
    current_user = view_helpers.get_current_user()
    courses, has_more = m.Course.search(flask.request.values, current_user)

    course_dict_list, user_course_dict_list, user_course_list = (
        m.Course.get_course_and_user_course_dicts(
            courses, current_user, include_friends=True,
            full_user_courses=False, include_sections=True))

    return util.json_dumps({
        'course_objs': course_dict_list,
        'has_more': has_more,
    })
