"""Initializes a Flask app so that multiple modules can register routes."""

# TODO(david): Should refactor to use Blueprints instead:
#     http://flask.pocoo.org/docs/blueprints/#blueprints

import flask


app = flask.Flask(__name__)

app.config.from_envvar('FLASK_CONFIG')

if not app.debug:
    from logging.handlers import TimedRotatingFileHandler
    logging.basicConfig(level=logging.INFO)

    formatter = logging.Formatter('%(asctime)s - %(levelname)s in'
            ' %(module)s:%(lineno)d %(message)s')

    file_handler = TimedRotatingFileHandler(
                        filename=app.config['LOG_PATH'],
                        when='D')
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(formatter)
    app.logger.addHandler(file_handler)
    logging.getLogger('').addHandler(file_handler)  # Root handler

    from log_handler import HipChatHandler
    hipchat_handler = HipChatHandler(s.HIPCHAT_TOKEN,
            s.HIPCHAT_HACK_ROOM_ID, notify=True, color='red',
            sender='Flask')
    hipchat_handler.setLevel(logging.ERROR)
    hipchat_handler.setFormatter(formatter)
    logging.getLogger('').addHandler(hipchat_handler)

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
    logging.basicConfig(level=logging.DEBUG)

# Create the directory for storing schedules if it does not exist
schedule_dir = get_schedule_dir()
if not os.path.exists(schedule_dir):
    os.makedirs(schedule_dir)

# create the directory for storing transcripts if it does not exist
transcript_dir = get_transcript_dir()
if not os.path.exists(transcript_dir):
    os.makedirs(transcript_dir)

