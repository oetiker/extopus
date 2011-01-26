#!/bin/sh
# Distribution Maker
set -e
if [ -d "$1/tool/bin" ]; then
   QOOXDOO_PATH=$1
   shift
fi
if [ x$QOOXDOO_PATH = x ]; then
   echo usage: $0 [qooxdoo-sdk-path] operation
   echo    or set QOOXDOO_PATH
   exit 1
fi
$QOOXDOO_PATH/tool/bin/generator.py -m QOOXDOO_PATH:$QOOXDOO_PATH -m CACHE:${TMP:-/tmp}/${USER}_QX_CACHE -m BUILD_PATH:../backend/public $1
