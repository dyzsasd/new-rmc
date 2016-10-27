from datetime import datetime

import flask

import rmc.common.rmclogger as rmclogger
from rmc.server.app import app
import rmc.server.api.v1 as api_v1
from rmc.server.api import comment as comment_api
from rmc.server.api import course as course_api
from rmc.server.api import prof as prof_api
from rmc.server.api import schedule as schedule_api
from rmc.server.api import user as user_api
import rmc.server.view_helpers as view_helpers
from rmc import settings as rmc_settings


app.register_blueprint(api_v1.api)
app.register_blueprint(course_api.api)
app.register_blueprint(comment_api.api)
app.register_blueprint(prof_api.api)
app.register_blueprint(schedule_api.api)
app.register_blueprint(user_api.api)

#app.register_blueprint(course_view.view)
#app.register_blueprint(professor_view.view)
#app.register_blueprint(profile_view.view)
#app.register_blueprint(schedule_view.view)


@app.route('/')
@app.route('/course')
@app.route('/course/<string:param>')
@app.route('/course/<string:param>/video')
def main(param=''):
    # Redirect logged-in users to profile
    # TODO(Sandy): If we request extra permissions from FB, we'll need to show
    # them the landing page to let them to Connect again and accept the new
    # permissions. Alternatively, we could use other means of requesting for
    # new perms
    request = flask.request
    logout = bool(request.values.get('logout'))
    referrer_id = request.values.get('meow') or request.values.get('referrer')

    if logout:
        view_helpers.logout_current_user()

    rmclogger.log_event(
        rmclogger.LOG_CATEGORY_IMPRESSION,
        rmclogger.LOG_EVENT_LANDING,
    )

    return flask.current_app.send_static_file('partials/main.html')


@app.before_request
def csrf_protect():
    """Require a valid CSRF token for any method other than GET."""
    req = flask.request

    # TODO(sandy): Use get-csrf-token from the API instead of excluding here
    # Exclude API login from CSRF protection, because API clients will not yet
    # have a CSRF token when they hit this endpoint (eg. mobile apps).
    if req.endpoint == 'api.login_facebook':
        return

    # Based on http://flask.pocoo.org/snippets/3/, but modified to use headers
    # and generally be more Rails-like
    if req.method != 'GET':
        # We intentionally don't invalidate CSRF tokens after a single use to
        # enable multiple AJAX requests originating from the page load to all
        # work off the same CSRF token.
        token = flask.session.get(view_helpers.SESSION_COOKIE_KEY_CSRF, None)
        if not token or token != req.headers.get('X-CSRF-Token'):
            flask.abort(403)


if __name__ == '__main__':
    # Late import since this isn't used on production
    if rmc_settings.debug:
        import flask_debugtoolbar
        toolbar = flask_debugtoolbar.DebugToolbarExtension(app)
    app.run()
