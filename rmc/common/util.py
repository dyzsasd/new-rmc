import datetime
import logging
import math
import random
import string
import traceback

import pytz

from bson import json_util, ObjectId

import rmc.shared.constants as c


NUM_DAYS_FRESH_DATA = 4 * 365
MIN_NUM_REVIEWS = 20
MIN_NUM_RATINGS = 20


def json_loads(json_str, *args, **kwargs):
    return json_util.loads(json_str, *args, **kwargs)


def json_dumps(obj, *args, **kwargs):
    return json_util.dumps(obj, *args, **kwargs).replace('</', '<\\/')


def dict_to_list(dikt):
    # TODO(jlfwong): This function's name is horribly misleading about what it
    # does - rename and document
    update_with_name = lambda key, val: dict(val, **{'name': key})
    return [update_with_name(k, v) for k, v in dikt.iteritems()]


# TODO(david): Why is this even here... should be in term.py
def get_term_id_for_date(the_date):
    # From http://ugradcalendar.uwaterloo.ca/page/uWaterloo-Calendar-Events-and-Academic-Deadlines
    # Seems should be usually right; just not sure of Spring term always
    # starting on May...
    # TODO(david): uWaterloo specific
    term_start_months = [9, 5, 1]

    # Find the month this term started
    for month in term_start_months:
        if the_date.month >= month:
            start_month = month
            break

    return "%d_%02d" % (the_date.year, start_month)


def get_current_term_id():
    return get_term_id_for_date(datetime.datetime.now())


# Ported Ruby's Statistics2.pnormaldist(qn) to Python
# http://stackoverflow.com/questions/6116770/whats-the-equivalent-of-rubys-pnormaldist-statistics-function-in-haskell
# inverse of normal distribution ([2])
# Pr( (-\infty, x] ) = qn -> x
def pnormaldist(qn):
    b = [1.570796288, 0.03706987906, -0.8364353589e-3,
        -0.2250947176e-3, 0.6841218299e-5, 0.5824238515e-5,
        -0.104527497e-5, 0.8360937017e-7, -0.3231081277e-8,
        0.3657763036e-10, 0.6936233982e-12]

    if qn < 0.0 or 1.0 < qn:
        logging.error("Error : qn <= 0 or qn >= 1  in pnorm()!")
        return 0.0

    if qn == 0.5:
        return 0.0

    w1 = qn
    if qn > 0.5:
        w1 = 1.0 - w1
    w3 = -math.log(4.0 * w1 * (1.0 - w1))
    w1 = b[0]
    for i in range(1, 11):
        w1 += b[i] * w3 ** i

    if qn > 0.5:
        return math.sqrt(w1 * w3)

    return -math.sqrt(w1 * w3)


def get_sorting_score(phat, n, confidence=c.RATINGS_CONFIDENCE):
    """
    Get the score used for sorting by ratings

    Returns the lower bound on Wilson Score. See
    http://evanmiller.org/how-not-to-sort-by-average-rating.html

    Args:
        phat: The observed proportion of positive ratings (0 <= phat <= 1)
        n: The total number of ratings
        confidence: How much confidences we want for this to be the lower bound
    """
    if n == 0:
        return 0

    try:
        if confidence == c.RATINGS_CONFIDENCE:
            z = 1.9599639715843482
        else:
            z = pnormaldist(1 - (1 - confidence) / 2)
        # Modified to optimize for our data model
        retVal = (phat + z * z / (2 * n) -
                  z * math.sqrt(
                      (phat * (1 - phat) + z * z / (4 * n)) /
                      n
                  )) / (1 + z * z / n)
    except:
        # This should never happen, so we should debug this case as soon as we
        # get the error.
        # Returning phat should be the same as calling the function with n=INF.
        # While this is bad, it's better than nothing and we can fix it
        # with the re-aggregator.
        logging.error('get_sorting_score(%s, %s, %s) threw an exception'
                % (phat, n, confidence))
        logging.error(' '.join(traceback.format_stack()))
        retVal = max(0, min(1, phat))
    return retVal


def flatten_dict(dikt):
    """Flatten dict into 1 level by JSON-encoding all non-primitive values."""
    flattened = {}
    for k, v in dikt.iteritems():
        if isinstance(v, dict) or isinstance(v, list):
            flattened[k] = json_util.dumps(v)
        elif isinstance(v, ObjectId):
            flattened[k] = str(v)
        else:
            flattened[k] = v
    return flattened


def eastern_to_utc(date):
    tz = pytz.timezone('US/Eastern')
    return utc_date(date, tz)


def utc_date(date, tz):
    return tz.normalize(tz.localize(date)).astimezone(pytz.utc)


def to_dict(doc, fields):
    """Warning: Using this convenience fn is probably not as efficient as the
    plain old manually building up a dict.
    """
    def map_field(prop):
        val = getattr(doc, prop)
        if isinstance(val, list):
            return [(e.to_dict() if hasattr(e, 'to_dict') else e) for e in val]
        else:
            return val.to_dict() if hasattr(val, 'to_dict') else val

    return {f: map_field(f) for f in fields}


def freshness_filter(objs, to_date_func, num_days=None):
    """Return results from within the past num_days days."""
    if num_days is None:
        num_days = NUM_DAYS_FRESH_DATA

    date_limit = datetime.datetime.now() - datetime.timedelta(days=num_days)

    return filter(lambda obj: to_date_func(obj) and
                              to_date_func(obj) >= date_limit, objs)


def publicly_visible_ratings_and_reviews_filter(
        objs, to_date_func, min_num_objs, num_days=None):
    """Return a filtered list of ratings and reviews that can be public facing.

    Return the "freshest" objects, but try to return at least min_num_objs.
    """
    if len(objs) <= min_num_objs:
        return objs

    filtered_objs = freshness_filter(objs, to_date_func, num_days)

    if len(filtered_objs) >= min_num_objs:
        results = filtered_objs
    else:
        results = objs[0:min_num_objs]

    return results


# TODO(jlfwong): Use a random generator that's cryptographically secure instead
def generate_secret_id(size=9, chars=string.ascii_uppercase + string.digits):
    return ''.join(random.choice(chars) for x in range(size))
