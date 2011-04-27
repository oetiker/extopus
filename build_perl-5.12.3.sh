#!/bin/bash
. `dirname $0`/sdbs.inc

simplebuild ftp://xmlsoft.org/libxml2/ libxml2-2.7.8.tar.gz --without-python

if prepare http://download.oracle.com/berkeley-db/ db-4.8.30.tar.gz ; then
    cd build_unix
    ../dist/configure \
        "--prefix=${PREFIX}"
    make
    make install
    touch $WORKDIR/db-4.8.30.tar.gz.ok
fi

if prepare http://search.cpan.org/CPAN/authors/id/R/RJ/RJBS perl-5.12.3.tar.gz; then
   make clean || true
   ./Configure -de \
        -Ui_db \
        -Dprefix=$PREFIX \
        -Dperlpath="$PREFIX/bin/perl" \
        -Dstartperl="#!$PREFIX/bin/perl" \
        -Dusethreads
   make
   make install
   touch $WORKDIR/perl-5.12.3.tar.gz.ok
fi



