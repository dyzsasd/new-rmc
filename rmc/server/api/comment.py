import json

import flask
import rmc.common.util as util
import rmc.models as m
import rmc.server.view_helpers as view_helpers


api = flask.Blueprint('comment_api', __name__, url_prefix='/api/comment')


@api.route('/', methods=['get'])
def get_or_create():
    course_id = flask.request.args.get('course_id')
    if not course_id:
        return flask.abort(400)
    current_user = view_helpers.get_current_user()
    if not current_user:
        return flask.abort(404)
    comment = m.CourseComment.objects(course_id=course_id, user_id=current_user.id).first()
    if not comment:
        comment = m.CourseComment(user_id=current_user.id, course_id=course_id)
    comment_dict = comment.to_mongo()
    if '_id' in comment_dict:
        comment_dict['id'] = str(comment_dict['_id'])
    return util.json_dumps(comment_dict)


@api.route('/comments/', methods=['get'])
def get_comments():
    course_id = flask.request.args.get('course_id')
    if not course_id:
        return flask.abort(400)
    start = int(flask.request.args.get('start') or 0)
    rows = int(flask.request.args.get('rows') or 100)
    current_user = view_helpers.get_current_user()
    comments = [
        comment.to_mongo() for comment in
        m.CourseComment.get_course_comments(course_id, current_user.friend_ids, start, rows)
    ]
    for comment in comments:
        comment['id'] = str(comment['_id'])
        if 'user_id' in comment:
            comment['user_id'] = 'undefined'
    return util.json_dumps(comments)


@api.route('/comments/count/', methods=['get'])
def get_count():
    course_id = flask.request.args.get('course_id')
    if not course_id:
        return flask.abort(400)
    current_user = view_helpers.get_current_user()
    comments = m.CourseComment.get_course_comments(course_id, current_user.friend_ids, 0, 10000)
    return util.json_dumps(len(comments))

@api.route('/prof/', methods=['get'])
def get_prof_comment():
    course_id = flask.request.args.get('course_id')
    if not course_id:
        return flask.abort(400)
    current_user = view_helpers.get_current_user()
    if not current_user:
        return flask.abort(404)
    comment = m.CourseProfessorComment.objects(course_id=course_id, user_id=current_user.id).first()
    if not comment:
        comment = m.CourseProfessorComment(user_id=current_user.id, course_id=course_id)
    comment_dict = comment.to_mongo()
    if '_id' in comment_dict:
        comment_dict['id'] = str(comment_dict['_id'])
    return util.json_dumps(comment_dict)


@api.route('/prof/', methods=['post'])
def create_prof_comment():
    comment = util.json_loads(flask.request.data)
    current_user = view_helpers.get_current_user()
    if not current_user or comment['user_id'] != current_user.id:
        return flask.abort(400)
    if 'course_id' not in comment or 'professor_id' not in comment:
        return flask.abort(400)
    comment_obj = m.CourseProfessorComment(
        course_id=comment['course_id'],
        professor_id=comment['professor_id'],
        user_id=comment['user_id']
    )
    comment_obj.update_by_dict(comment)
    comment_obj.save()

    saved_comment_obj = comment_obj.to_mongo()

    if '_id' in saved_comment_obj:
        saved_comment_obj['id'] = str(saved_comment_obj['_id'])

    return util.json_dumps(saved_comment_obj)


@api.route('/prof/<string:prof_id>', methods=['put'])
def update_prof_comment(prof_id):
    course_prof_comment = m.CourseProfessorComment.objects(id=prof_id).first()
    comment = util.json_loads(flask.request.data)
    current_user = view_helpers.get_current_user()
    if not current_user or comment['user_id'] != current_user.id or course_prof_comment is None:
        return flask.abort(400)
    if 'course_id' not in comment or 'professor_id' not in comment:
        return flask.abort(400)

    course_prof_comment.update_by_dict(comment)
    course_prof_comment.save()

    return util.json_dumps({})
