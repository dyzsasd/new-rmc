from datetime import datetime

import mongoengine as me


_PRIVACY_LEVELS = {
    'me': 0,
    'friends': 1,
    'everyone': 2,
}

MIN_COMMENT_LENGTH = 11


class BaseComment(me.Document):
    text = me.StringField(default='', max_length=4096)
    created_at = me.DateTimeField(default=datetime.utcnow)
    last_updated_at = me.DateTimeField(default=datetime.utcnow)
    shared_at = me.DateTimeField()
    rating_updated_at = me.DateTimeField()
    privacy = me.IntField(
        choices=_PRIVACY_LEVELS.values(), default=_PRIVACY_LEVELS['friends'])
    num_voted_helpful = me.IntField(default=0)
    num_voted_not_helpful = me.IntField(default=0)

    meta = {
        'abstract': True,
    }

    def is_empty(self):
        if not self.text and self.text == '':
            return True

    def non_empty(self):
        return not self.is_empty()


class CourseComment(BaseComment):
    user_id = me.ObjectIdField(required=True)
    course_id = me.StringField(required=True)

    interest = me.FloatField(min_value=0.0, max_value=1.0, default=None)
    easiness = me.FloatField(min_value=0.0, max_value=1.0, default=None)
    usefulness = me.FloatField(min_value=0.0, max_value=1.0, default=None)

    meta = {
        'indexes': [
            'course_id',
            'user_id',
        ],
    }

    @classmethod
    def get_course_comments(cls, course_id, friend_ids = None, start=0, rows=10):
        friend_ids = friend_ids | []
        comments = cls.objects(__raw__={
            "$or": [
                {"course_id": course_id, "privacy": _PRIVACY_LEVELS['everyone']},
                {
                    "course_id": course_id,
                    "privacy": _PRIVACY_LEVELS['friends'],
                    "user_id": {"$in": friend_ids}
                },
            ]
        }).order_by('created_at')
        return comments[start: start + rows]


class CourseProfessorComment(BaseComment):
    user_id = me.ObjectIdField(required=True)
    course_id = me.StringField(required=True)
    professor_id = me.StringField(required=True)

    clarity = me.FloatField(min_value=0.0, max_value=1.0, default=None)
    passion = me.FloatField(min_value=0.0, max_value=1.0, default=None)

    meta = {
        'indexes': [
            'course_id',
            'user_id',
            'professor_id',
        ],
    }
