import flask

import rmc.models as m
import rmc.server.view_helpers as view_helpers


professor_view = flask.Blueprint('professor_view', __name__, url_prefix='/professor')


@app.route('/<string:prof_id>')
def prof_page(prof_id):
    prof = m.Professor.objects.with_id(prof_id)
    if not prof:
        flask.abort(404)

    current_user = view_helpers.get_current_user()
    courses_taught = prof.get_courses_taught()
    courses = m.Course.objects(id__in=courses_taught)
    full_course_info = [c.to_dict() for c in courses]

    return flask.render_template(
        'prof_page.html',
         page_script='prof_page.js',
         prof_name=prof.name,
         prof_ratings=prof.get_ratings_for_career(),
         prof_courses=courses_taught,
         prof_courses_full=full_course_info,
         prof_departments_list=prof.get_departments_taught(),
         tip_objs_by_course=prof.get_reviews_for_all_courses(current_user)
     )
