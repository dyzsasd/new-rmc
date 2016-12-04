import flask
from flask_jwt import jwt_required, current_identity
import requests

import rmc.common.util as util
import rmc.models as m
from rmc.settings import VIDEO_TOKEN

from datetime import datetime


api = flask.Blueprint('user_course_api', __name__, url_prefix='/api/user_course')


class VideoClient(object):
    endpoint = 'https://api.video.tkcourse.com'

    def _parse_course_id(self, course_id):
        subject = course_id[:3].upper()
        catalog = course_id[3:6]
        return (subject, catalog)

    def get_course_videos(self, course_id):
        subject, catalog = self._parse_course_id(course_id)
        return requests.get(self.endpoint + '/video/meta/list/%s/%s' % (subject, catalog)).json

    def get_video(self, video_id):
        meta = requests.get(self.endpoint + '/video/meta/%s' % video_id).json
        return meta

    def get_stream(self, video_id, user_id):
        headers = {
            "Video-Requested-At": datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S GMT'),
            "Video-User": user_id,
            "Video-Requested-From": '10.4.2.56',
            "Video-Host": 'www.tkcourse.com'
        }
        token = requests.get(self.endpoint + '/video/stream/token/video/%s' % video_id, headers=headers).json
        url = requests.get(self.endpoint + '/video/stream/video/%s?cdn=true' % video_id, headers={
            "Video-Stream-Retrieve-Token": token['token']
        }).json
        return url


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
        _video_client.get_video(video['id']) for video in videos
    ]

    return util.json_dumps(video_metas)

@api.route('/<string:course_id>/stream', methods=['GET'])
@jwt_required()
def get_stream(course_id):
    course_id = course_id.lower()
    _tk = flask.request.args.get('_tk')
    url = _video_client.get_stream(_tk, current_identity.id)
    print url
    return util.json_dumps(url)
