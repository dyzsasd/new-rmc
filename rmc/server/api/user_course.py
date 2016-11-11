import flask
from flask_jwt import jwt_required, current_identity
import requests

import rmc.common.util as util
import rmc.models as m
from rmc.settings import VIDEO_TOKEN


api = flask.Blueprint('user_course_api', __name__, url_prefix='/api/user_course')


class VideoClient(object):
    endpoint = 'https://api.video.tkcourse.com/'

    def _parse_course_id(self, course_id):
        subject = course_id[:3]
        catalog = course_id[4:7]
        return (subject, catalog)

    def get_course_videos(self, course_id):
        subject, catalog = self._parse_course_id(course_id)
        print requests.get(self.endpoint + '/video/meta/list/%s/%s' % (subject, catalog)).json
        return requests.get(self.endpoint + '/video/meta/list/%s/%s' % (subject, catalog)).json

    def get_video(self, video_id):
        return requests.get(self.endpoint + '/video/meta/%s?access=%s' % (video_id, VIDEO_TOKEN)).json


_video_client = VideoClient()


@api.route('/<string:course_id>/video', methods=['GET'])
@jwt_required()
def get_courses_video(course_id):
    course_id = course_id.lower()
    ucs = m.UserCourse.objects(course_id=course_id, user_id=current_identity.id)
    if not ucs:
        ucs = m.UserCourse(course_id=course_id, user_id=current_identity.id)
        ucs.save()
    videos = _video_client.get_course_videos(course_id)
    video_metas = [
        _video_client.get_video(video.id) for video in videos
    ]

    return util.json_dumps(video_metas)
