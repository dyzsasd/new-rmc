import os


RMC_ROOT = os.path.join(os.path.dirname(__file__), "..")
SHARED_DATA_DIR = os.path.join(RMC_ROOT, 'shared_data')

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

from rmc.local_settings import *
