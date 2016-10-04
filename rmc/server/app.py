import logging
from logging.handlers import TimedRotatingFileHandler
import os

import flask

from rmc.settings import debug_settings, DEFAULT_LOG_PATH


def _create_file_log_handler(log_path):
    formatter = logging.Formatter('%(asctime)s - %(levelname)s in'
                                  ' %(module)s:%(lineno)d %(message)s')
    file_handler = TimedRotatingFileHandler(filename=log_path, when='D')
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(formatter)
    return file_handler


app = flask.Flask(__name__)

if hasattr(os.environ, 'FLASK_CONFIG'):
    app.config.from_envvar('FLASK_CONFIG')

if app.debug:
    app.config['SECRET_KEY'] = debug_settings['key']
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
    log_path = app.config.get('LOG_PATH') or DEFAULT_LOG_PATH
    file_handler = _create_file_log_handler(log_path)
    app.logger.addHandler(file_handler)
    logging.getLogger('').addHandler(file_handler)
