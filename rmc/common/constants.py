import os
from rmc.common.local_setting import local_setting


IS_PROD = os.path.isdir('/home/rmc')

# NOTE: This relies on the fact that this file is one level above the repo root
RMC_ROOT = os.path.join(os.path.dirname(__file__), "..")

if IS_PROD:
    SHARED_DATA_DIR = '/home/rmc/data'
else:
    SHARED_DATA_DIR = os.path.join(RMC_ROOT, 'shared_data')

# define cross file constants here

MONGO_HOST = local_setting['mongo'].get('host') or 'localhost'
MONGO_PORT = local_setting['mongo'].get('port') or 27017
MONGO_DB_RMC = local_setting['mongo'].get('db') or 'rmc'

REDIS_HOST = local_setting['redis'].get('host') or 'localhost'
REDIS_PORT = local_setting['redis'].get('port') or 6379
REDIS_DB = local_setting['redis'].get('db') or 0

if IS_PROD:
    RMC_HOST = "https://uwflow.com"
else:
    RMC_HOST = "http://localhost:5000"

TERMS_OFFERED_DATA_DIR = 'terms_offered'
OPENDATA2_COURSES_DATA_DIR = 'opendata2_courses'
REVIEWS_DATA_DIR = 'reviews'
DEPARTMENTS_DATA_DIR = 'departments'
RAW_DEPARTMENTS_DATA_FILE = 'raw_apartments'
EXAMS_DATA_DIR = 'exam_schedules'
SECTIONS_DATA_DIR = 'opendata_sections'
SCHOLARSHIPS_DATA_DIR = 'scholarships'
RAW_COURSES_DB = 'raw_course_db_json'

RATINGS_CONFIDENCE = 0.95

# Demo accounts
# TODO(Sandy): Have multiple demo accounts?
DEMO_ACCOUNT_FBID = '100004384843130'

# A long token normally lasts for 60 days
FB_FORCE_TOKEN_EXPIRATION_DAYS = 57