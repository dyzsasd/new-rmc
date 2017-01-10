#!/bin/bash

ROOT="$(readlink -m "$0/../..")"

REDIS_VERSION="stable"
REDIS_HOME="run/redis-linux"
REDIS_URL="http://download.redis.io/redis-${REDIS_VERSION}.tar.gz"

cd $ROOT
mkdir -p $REDIS_HOME

cd "$REDIS_HOME"

if [ ! -d "$REDIS_VERSION" ]; then
    mkdir "$REDIS_VERSION"
    cd "$REDIS_VERSION"
    echo "Downloading Redis ${REDIS_VERSION} from ${REDIS_URL}..."
    wget $REDIS_URL -O redis.tar.gz
    tar -C ./ -zxf redis.tar.gz
    rm redis.tar.gz
    cd "redis-stable"
    make
else
    cd "$REDIS_VERSION"
    cd "redis-stable"
fi

src/redis-server $ROOT/config/redis_local.conf "$@"
