from datetime import timedelta
import logging
from logging.handlers import TimedRotatingFileHandler

import flask
from flask_jwt import JWT, jwt_required, current_identity

from rmc.models import User
from rmc.settings import flask_settings, SECRET_KEY


def _create_file_log_handler(log_path):
    formatter = logging.Formatter('%(asctime)s - %(levelname)s in'
                                  ' %(module)s:%(lineno)d %(message)s')
    file_handler = TimedRotatingFileHandler(filename=log_path, when='D')
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(formatter)
    return file_handler


app = flask.Flask(__name__)

app.config.update(**flask_settings)

app.config['SECRET_KEY'] = SECRET_KEY

if app.debug:
    logging.basicConfig(level=logging.DEBUG)
    app.config.update({
        'DEBUG_TB_INTERCEPT_REDIRECTS': False,
        'DEBUG_TB_PROFILER_ENABLED': True,
        'DEBUG_TB_PANELS': [
            'flask_debugtoolbar.panels.versions.VersionDebugPanel',
            'flask_debugtoolbar.panels.timer.TimerDebugPanel',
            'flask_debugtoolbar.panels.headers.HeaderDebugPanel',
            'flask_debugtoolbar.panels.request_vars.RequestVarsDebugPanel',
            'flask_debugtoolbar.panels.template.TemplateDebugPanel',
            'flask_debugtoolbar.panels.logger.LoggingPanel',
            'flask_debugtoolbar.panels.profiler.ProfilerDebugPanel',
            'flask_debugtoolbar_lineprofilerpanel.panels.LineProfilerPanel'
        ]
    })
else:
    logging.basicConfig(level=logging.INFO)
    file_handler = _create_file_log_handler(app.config.get('LOG_PATH'))
    app.logger.addHandler(file_handler)
    logging.getLogger('').addHandler(file_handler)


class UserToken(object):
    def __init__(self, id, email):
        self.id = id
        self.email = email

def authenticate(email, password):
    user = User.auth_user(email, password)
    if user:
        return UserToken(str(user.id), user.email)

def identity(payload):
    user_id = payload['identity']
    user = User.objects(id=user_id).first()
    if user:
        return UserToken(str(user.pk), user.email)

app.config['JWT_AUTH_USERNAME_KEY'] = 'email'
app.config['JWT_EXPIRATION_DELTA'] = timedelta(seconds=3600)

jwt = JWT(app, authenticate, identity)
