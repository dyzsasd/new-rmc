#!/bin/bash

ROOT="$(readlink -m "$0/../..")"

echo $ROOT

PYTHONPATH="$ROOT/..:$PYTHONPATH" \
  uwsgi \
    --socket $ROOT/../uwsgi.sock \
    --chmod-socket=666 \
    --wsgi-file $ROOT/rmc/server/server.wsgi \
    --callable app \
    --master \
    --workers 8 \
    --close-on-exec \
    --enable-threads \
    --virtualenv $ROOT/env \
    --buffer-size 32768 \
    --pidfile /tmp/rmc.pid \
    --stats 127.0.0.1:9191	
