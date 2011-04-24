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

simplebuild ftp://xmlsoft.org/libxml2/ libxml2-2.7.8.tar.gz

if prepare http://download.oracle.com/berkeley-db/ db-4.8.30.tar.gz ; then
    cd build_unix
    ../dist/configure \
        "--prefix=${PREFIX}" \
        "--exec-prefix=${EPREFIX}" \
        '--enable-compat185' \
        '--enable-cxx'        
    make
    make install
    touch $WORKDIR/db-4.8.30.tar.gz.ok
fi

if prepare http://search.cpan.org/CPAN/authors/id/R/RJ/RJBS perl-5.12.3.tar.gz; then
   make clean || true
   ./Configure -de \
        -Dprefix=$PREFIX \
        -Dperlpath="$PREFIX/bin/perl" \
        -Dstartperl="#!$PREFIX/bin/perl" \
        -Dusethreads
   make
   make install
   touch $WORKDIR/perl-5.12.3.tar.gz.ok
fi

                                                       