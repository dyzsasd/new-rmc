from datetime import datetime

import mongoengine as me


class PromotionCode(me.Document):
    code = me.StringField(required=True)
    quantity = me.IntField(required=True, default=1)
    _type = me.StringField(required=True)
    created_at = me.DateTimeField(default=datetime.utcnow)
