import os

JS_DIR = 'js'
DEBUG = True
ENV = 'dev'
GA_PROPERTY_ID = 'UA-35073503-2'
LOG_DIR = os.environ.get('RMC_LOG_DIR') or '/var/log/rmc_log'
LOG_PATH = os.path.join(LOG_DIR, 'server/server.log')
