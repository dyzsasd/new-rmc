#!/bin/bash

ROOT="$(readlink -m "$0/../..")"

COMMAND="$1"
shift 1

case "$COMMAND" in

    "local")
        echo "Starting local flask server"
        PYTHONPATH="$ROOT"  \
		  RMC_LOG_DIR="$ROOT/logs"  \
          python rmc/server/server.py
        ;;

    "remote")
        echo "Starting remote flask server"
        RMC_LOG_DIR="$ROOT/logs" \
        PYTHONPATH="$ROOT/../" uwsgi \
          --http-socket 0.0.0.0:5000 \
          --wsgi-file $ROOT/rmc/server/server.wsgi \
          --callable app \
          --master \
          --workers 4 \
          --close-on-exec \
          --enable-threads \
          --virtualenv $ROOT/env \
          --buffer-size 32768 \
          --python-autoreload 1 \
          --pidfile /tmp/rmc.pid \
          --no-site
        ;;
    *)

    echo "Usage: $0  {local|remote}"
    exit
    ;;

esac
