#!/bin/sh
here=`dirname $0`
ROOT=`cd $here/../../;pwd`
db=$ROOT/db_nohb
[ -d $db ] || mkdir -p $db
export PATH=$ROOT/thirdparty/bin:$PATH
mongod --dbpath $db --bind_ip 127.0.0.1 --logpath $db/mongo.log --fork
