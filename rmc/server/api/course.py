import flask

import rmc.common.util as util
import rmc.models as m


api = flask.Blueprint('course_api', __name__, url_prefix='/api/course')


@api.route('/<string:course_id>', methods=['GET'])
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

    professor_dict_list = m.Professor.get_reduced_professors_for_courses(
        courses)

    user_dict_list = []
    if current_user:
        user_ids = [uc['user_id'] for uc in user_course_dict_list
                    if uc['user_id'] != current_user.id]
        users = m.User.objects(id__in=user_ids).only(*m.User.CORE_FIELDS)
        user_dict_list = [u.to_dict() for u in users]

    return util.json_dumps({
        'user_objs': user_dict_list,
        'course_objs': course_dict_list,
        'professor_objs': professor_dict_list,
        'user_course_objs': user_course_dict_list,
        'has_more': has_more,
    })
