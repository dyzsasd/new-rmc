#!/bin/bash

ROOT="$(readlink -m "$0/../..")"

COMMAND="$1"
shift 1

case "$COMMAND" in

    "local")
        echo "Starting local flask server"
        FLASK_CONFIG=$ROOT/config/flask_dev.py \
          PYTHONPATH="$ROOT/../" \
          python rmc/server/server.py
        ;;

    "remote")
        echo "Starting remote flask server"
        PYTHONPATH="$ROOT/../" uwsgi \
          --http 0.0.0.0:5000 \
          --chmod-socket=666 \
          --env FLASK_CONFIG=$ROOT/config/flask_dev.py \
          --wsgi-file $ROOT/rmc/server/server.wsgi \
          --callable app \
          --master \
          --workers 4 \
          --close-on-exec \
          --enable-threads \
          --virtualenv $ROOT/env \
          --buffer-size 32768 \
          --python-autoreload 1 \
          --pidfile /tmp/rmc.pid 
        ;;
    *)

    echo "Usage: $0  {local|remote}"
    exit
    ;;

esac
