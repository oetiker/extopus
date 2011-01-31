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

if prepare ftp://ftp.mozilla.org/pub/mozilla.org/js js-1.7.0.tar.gz; then
cd src
env CFLAGS="-DJS_C_STRINGS_ARE_UTF8" make JS_DIST=$PREFIX -f Makefile.ref
env CFLAGS="-DJS_C_STRINGS_ARE_UTF8" make JS_DIST=$PREFIX -f Makefile.ref export
touch $WORKDIR/js-1.7.0.tar.gz.ok
fi

if prepare http://sourceforge.net/projects/boost/files/boost/1.45.0 boost_1_45_0.tar.bz2; then
  ./bootstrap.sh
  ./bjam --prefix=$PREFIX address-model=64 variant=release --with-filesystem --with-thread --with-date_time --layout=versioned --with-program_options link=shared runtime-link=shared threading=multi install
  touch $WORKDIR/boost_1_45_0.tar.bz2.ok
fi

if prepare http://prdownloads.sourceforge.net/scons scons-2.0.1.tar.gz; then
  python setup.py install --prefix=$PREFIX
  touch $WORKDIR/scons-2.0.1.tar.gz.ok
fi

if prepare http://downloads.mongodb.org/src mongodb-src-r1.6.5.tar.gz ; then
  patch -p0 <<PATCH_END
--- /home/oetiker/.jmacs_backup/SConstruct~     2011-01-20 17:33:16.000000000 +0100
+++ SConstruct  2011-01-20 17:33:21.000000000 +0100
@@ -566,6 +566,8 @@
 
     if static:
         env.Append( LINKFLAGS=" -static " )
+    else: 
+        env.Append( LINKFLAGS="-Wl,-rpath -Wl,$PREFIX/lib64 -Wl,-rpath -Wl,$PREFIX/lib")
 
 elif "sunos5" == os.sys.platform:
      nix = True

PATCH_END
  GCC=`gcc --version | perl -n -e 'm/gcc.+?(\d)\.(\d)/ && print "gcc$1$2"'`
  scons --extrapathdyn=$PREFIX --prefix=$PREFIX --boost-version=1_45 --boost-compiler=$GCC --cpppath=$PREFIX/include/boost-1_45 --sharedclient install
  touch $WORKDIR/mongodb-src-r1.6.5.tar.gz.ok
fi

