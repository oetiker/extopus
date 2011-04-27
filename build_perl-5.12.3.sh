#!/bin/bash
. `dirname $0`/sdbs.inc

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



