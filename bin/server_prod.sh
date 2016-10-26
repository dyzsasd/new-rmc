#!/bin/bash

ROOT="$(readlink -m "$0/../..")"

echo $ROOT

PYTHONPATH="$ROOT/..:$PYTHONPATH" \
  uwsgi \
    --http :5000
    --env FLASK_CONFIG=$ROOT/config/flask_prod.py \
    --wsgi-file $ROOT/rmc/server/server.wsgi \
    --callable app \
    --master \
    --workers 4 \
    --close-on-exec \
    --enable-threads \
    --virtualenv $ROOT/env \
    --buffer-size 32768 \
    --pidfile /tmp/rmc.pid 
