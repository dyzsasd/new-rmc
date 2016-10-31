from datetime import datetime

import bson
import flask
import werkzeug.exceptions as exceptions
from werkzeug.local import LocalProxy

from rmc import settings as rmc_settings
from rmc.common import facebook
import rmc.common.rmclogger as rmclogger
from rmc.models import User
from rmc.server.app import app
from rmc.server.app import UserToken
import rmc.server.api.v1 as api_v1
from rmc.server.api import comment as comment_api
from rmc.server.api import course as course_api
from rmc.server.api import prof as prof_api
from rmc.server.api import schedule as schedule_api
from rmc.server.api import user as user_api
import rmc.server.view_helpers as view_helpers
from rmc.server.utils import parse_token


_jwt = LocalProxy(lambda: app.extensions['jwt'])

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


@app.route('/signup', methods=['POST'])
def sign_up():
    user = flask.request.get_json()
    print user
    new_user = User.create_new_user_from_email(
        user['first_name'], user['last_name'],
        user['email'], user['password'])
    return str(new_user.to_dict())


@app.route('/login/facebook', methods=['POST'])
def login_with_facebook():
    req = flask.request

    fbsr = req.form.get('fb_signed_request')

    if (fbsr is None):
        raise exceptions.ImATeapot('No fbsr set')

    fb_data = facebook.get_fb_data(fbsr, app.config)
    fbid = fb_data['fbid']
    fb_access_token = fb_data['access_token']
    fb_access_token_expiry_date = fb_data['expires_on']
    is_invalid = fb_data['is_invalid']

    user = User.objects(fbid=fbid).first()
    if user:
        # Existing user. Update with their latest Facebook info
        user.fb_access_token = fb_access_token
        user.fb_access_token_expiry_date = fb_access_token_expiry_date
        user.fb_access_token_invalid = is_invalid
        user.save()
    else:
        # New user, or existing email logins user.
        now = datetime.now()
        email = req.form.get('email')
        user_data = {
            'fb_access_token': fb_access_token,
            'fb_access_token_expiry_date': fb_access_token_expiry_date,
            'fbid': fbid,
            'friend_fbids': flask.json.loads(req.form.get('friend_fbids')),
            'gender': req.form.get('gender'),
            'last_visited': now,
        }

        user = User.objects(email=email).first() if email else None
        if user:
            for k, v in user_data.iteritems():
                user[k] = v
            user.save()
        else:
            # Create an account with their Facebook data
            user_data.update({
                'email': email,
                'first_name': req.form.get('first_name'),
                'join_date': now,
                'join_source': m.User.JoinSource.FACEBOOK,
                'last_name': req.form.get('last_name'),
                'middle_name': req.form.get('middle_name'),
            })

            referrer_id = req.form.get('referrer_id')
            if referrer_id:
                try:
                    user_data['referrer_id'] = bson.ObjectId(referrer_id)
                except bson.errors.InvalidId:
                    pass

            user = m.User(**user_data)
            user.save()
    if user:
        identity = UserToken(str(user.pk), user.email or '')
        access_token = _jwt.jwt_encode_callback(identity)



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


if __name__ == '__main__':
    # Late import since this isn't used on production
    if rmc_settings.debug:
        import flask_debugtoolbar
        toolbar = flask_debugtoolbar.DebugToolbarExtension(app)
    app.run()
