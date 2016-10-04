import flask

import rmc.models as m
import rmc.server.view_helpers as view_helpers


view = flask.Blueprint('profile_view', __name__, url_prefix='/profile')


@view.route('/demo')
def demo_profile():
    fbid = c.DEMO_ACCOUNT_FBID
    user = m.User.objects(fbid=fbid).first()

    # To catch errors on dev. We may not all have the test account in our mongo
    if user is None:
        logging.error("Accessed non-existant test/demo account %s" % fbid)
        return flask.redirect('/profile')

    return profile.render_profile_page(user.id, user)


# TODO(mack): maybe support fbid in addition to user_id
# TODO(mack): move each api into own class
@view.route('/', defaults={'profile_user_id': None})
@view.route('/<string:profile_user_id>')
@view_helpers.login_required
def profile_page(profile_user_id):
    return profile.render_profile_page(profile_user_id)