from datetime import datetime

import mongoengine as me


class UserCourse(me.Document):
    user_id = me.ObjectIdField(required=True)
    course_id = me.StringField(required=True)

    created_at = me.DateTimeField(default=datetime.utcnow)

    # TODO: change default to n
    right = me.StringField(default='r')  # r, w, r/w, n

    price = me.FloatField(default=9.99)
    is_paied = me.BooleanField(default=False)
    paied_at = me.DateTimeField()

    start_from = me.DateTimeField()
    expired_at = me.DateTimeField()
