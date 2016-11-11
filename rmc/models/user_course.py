from datetime import datetime

import mongoengine as me


class UserCourse(me.Document):
    user_id = me.ObjectIdField(required=True)
    course_id = me.StringField(required=True)

    created_at = me.DateTimeField(default=datetime.utcnow)

    price = me.FloatField()
    is_paied = me.DateTimeField()
    paied_at = me.DateTimeField()

    start_from = me.DateTimeField()
    expired_at = me.DateTimeField()
