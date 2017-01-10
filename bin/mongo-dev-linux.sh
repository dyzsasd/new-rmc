#!/bin/bash

ROOT="$(readlink -m "$0/../..")"

MONGODB_VERSION="3.2.8"
MONGODB_HOME="run/mongodb-linux"
MONGODB_URL="https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-${MONGODB_VERSION}.tgz"

cd $ROOT
mkdir -p $MONGODB_HOME

cd "$MONGODB_HOME"

if [ ! -d "$MONGODB_VERSION" ]; then
    mkdir "$MONGODB_VERSION"
    cd "$MONGODB_VERSION"
    echo "Downloading MongoDB ${MONGODB_VERSION} from ${MONGODB_URL}..."
    wget $MONGODB_URL -O mongodb.tgz
    tar -C ./ -zxf mongodb.tgz
    rm mongodb.tgz
else
    cd "$MONGODB_VERSION"
fi
cd "mongodb-linux-x86_64-$MONGODB_VERSION"

DBPATH="$ROOT/$MONGODB_HOME/mongodb"
LOGPATH="$ROOT/$MONGODB_HOME/mongo.log"

if [ ! -d "$DBPATH" ]; then
    mkdir -p $DBPATH
fi

if [ ! -f "$LOGPATH" ]; then
    touch $LOGPATH
fi

COMMAND="$1"
shift 1

case "$COMMAND" in

    "start")
        echo "Starting mongodb"
        bin/mongod --fork --dbpath $DBPATH --logpath $LOGPATH \
                   --logappend --config $ROOT/config/mongodb_local.conf "${@: -1}"
        ;;

    "stop")
        echo "Stopping mongodb"
        bin/mongod --shutdown --dbpath $DBPATH --logpath $LOGPATH "${@: -1}"
        ;;

    "run")
        bin/mongod --dbpath $DBPATH \
                   --config $ROOT/config/mongodb_local.conf "${@: -1}"
        ;;
    *)

    echo "Usage: $0  {start|stop|run}"
    exit
    ;;

esac
