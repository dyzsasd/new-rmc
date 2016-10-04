import flask

import rmc.models as m
import rmc.server.view_helpers as view_helpers


view = flask.Blueprint('schedule_view', __name__, url_prefix='/schedule')


@view.route('/ical/<string:profile_user_secret_id>.ics')
def schedule_page_ical(profile_user_secret_id):
    return profile.render_schedule_ical_feed(profile_user_secret_id)


# TODO(david): Figure out why there's a user who's hitting
# /schedule/RIGFOY5JA.ics on regular intervals... I'm guessing user might've
# exported improperly by just pasting the "/schedule/RIGFOY5JA" URL into their
# calendar app's schedule import.
@view.route('/<string:profile_user_secret_id>.ics')
def schedule_page_ics_redirect(profile_user_secret_id):
    return flask.redirect('/schedule/ical/%s.ics' % profile_user_secret_id,
                          301)


@view.route('/<string:profile_user_secret_id>')
def schedule_page(profile_user_secret_id):
    profile_user = (m.User.objects(secret_id=profile_user_secret_id.upper())
                    .first())

    return profile.render_schedule_page(profile_user)