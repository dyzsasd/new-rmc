"""This is a template for secrets.py, which contains authentication
codes/tokens and other secrets that are not checked in.

Ask a Flow admin if you need any specific code below.
"""

# This revokable key is required to be able to log in with Facebook locally.
FB_APP_SECRET_DEV = '8179b0ea512e38a860baea7e2145cd85'
FB_APP_SECRET_TEST = '039fe0a7aba25b0231d35256e388753f'

FB_APP_SECRET_PROD = '2517e7c524a568f4a7e2cddb2ddeedf7'

HIPCHAT_HACK_ROOM_ID = 31337
HIPCHAT_PUBLIC_ROOM_ID = 1337
HIPCHAT_TOKEN = 'deadbeef123456789deadbeef12345'

AWS_KEY_ID = 'ITWASRAREIWASTHERE'
AWS_SECRET_KEY = 'HeYyouCallmeupagainJusttObreakMelikeaPromise'

FLASK_SECRET_KEY = 'likeafireworksshow'

# Shh, don't let the NSA know we have this.
US_NUCLEAR_LAUNCH_CODE = '00000000'

# NOTE: This key is only for local usage. The API key used in production is
# different.
OPEN_DATA_API_KEY = '5da84ced3d60901f54666c2f338c908d'

# This is a fake Flickr API key - if you need to use the Flickr API (just used
# for downloading kittens at the moment), generate one yourself.
# FLICKR_API_KEY = 'loveyouifyouloveacarfortheroadtrips'

# Used for server projects that access Google APIs (in our case, for Android
# push notifications via GCM). Generate one at console.developers.google.com
GOOGLE_SERVER_PROJECT_API_KEY = 'ihadthetimeofmylifefightingdragonswithyou'
