#!/bin/bash
## other decision structure
set -o errexit
# don't try to remember where things are
set +o hashall
## do not tollerate unset variables
set -u

if [ x$1 = 'x' ]; then
   echo "Missing destination directory."
   exit 1
fi

export LD_LIBRARY_PATH=
export PREFIX=$1

. `dirname $0`/module_builder.inc

R="-Wl,-rpath -Wl,"
export LDFLAGS=${R}$PREFIX/lib64

simplebuild http://www.erlang.org/download/ otp_src_R14B02.tar.gz --without-javac 

if prepare ftp://ftp.mozilla.org/pub/mozilla.org/js js-1.7.0.tar.gz; then
cd src
env CFLAGS="-DJS_C_STRINGS_ARE_UTF8" make JS_DIST=$PREFIX -f Makefile.ref
env CFLAGS="-DJS_C_STRINGS_ARE_UTF8" make JS_DIST=$PREFIX -f Makefile.ref export
touch $WORKDIR/js-1.7.0.tar.gz.ok
fi

simplebuild http://curl.haxx.se/download/ curl-7.21.4.tar.gz
simplebuild http://apache.mirror.testserver.li//couchdb/1.0.2/ apache-couchdb-1.0.2.tar.gz \
  --with-erlang=$PREFIX/lib/erlang/usr/include \
  --with-js-include=$PREFIX/include \
  --with-js-lib=$PREFIX/lib64

