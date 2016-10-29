from datetime import datetime, timedelta

import jwt

from rmc import settings as rmc_settings


def create_token(user):
    payload = {
        'sub': user.id,
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(days=1)
    }
    token = jwt.encode(payload, rmc_settings.SECRET_KEY, algorithm='HS256')
    return token.decode('unicode_escape')

def parse_token(token):
    return jwt.decode(token, rmc_settings.SECRET_KEY, algorithms='HS256')