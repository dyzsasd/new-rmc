import os

import mongoengine as me

import rmc.models as m
from rmc.settings import mongodb_settings, SHARED_DATA_DIR

FILE_DIR = os.path.dirname(os.path.realpath(__file__))
HTML_DIR = os.path.join(SHARED_DATA_DIR, 'html_snapshots')

me.connect(mongodb_settings['db'], host=mongodb_settings['host'], port=mongodb_settings['port'])


def write(file_path, content):
    ensure_dir(file_path)
    with open(file_path, 'w') as f:
        f.write(content)


def ensure_dir(file_path):
    d = os.path.dirname(file_path)
    if not os.path.exists(d):
        os.makedirs(d)


def generate_urls():
    urls = []
    # Home page
    urls.append('')
    # Course pages
    for course in m.Course.objects:
        course_id = course.id
        urls.append('course/' + course_id)
    return urls
