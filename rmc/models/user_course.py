from datetime import datetime

import mongoengine as me


class UserCourse(me.Document):
    user_id = me.ObjectIdField(required=True)
    course_id = me.StringField(required=True)

    created_at = me.DateTimeField(default=datetime.utcnow)

    # TODO: change default to n
    read = me.BooleanField(default=False)
    edit = me.BooleanField(default=False)
    admin = me.BooleanField(default=False)

    price = me.FloatField(default=9.99)

    start_from = me.DateTimeField()
    expired_at = me.DateTimeField()

    # Paypal payment information
    payment_token = me.StringField()
    payment_token_expired = me.DateTimeField()

    # Payment information
    payment_success = me.BooleanField(default=False)
    payer_id = me.StringField()
    payment_at = me.DateTimeField()
    promotion_code = me.StringField()
