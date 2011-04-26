#!/bin/bash
set -e
cd `dirname "$0"`
install=`cd ..;pwd`/thirdparty
[ -d $install/bin ] || mkdir -p $install/bin
export PERL=perl
export PERL_CPANM_HOME="$install"
export PERL_CPANM_OPT="--notest --local-lib $install"
export PATH=$install/bin:$PATH
export PERL5LIB=$install/lib/perl5
export BERKELEYDB_INCLUDE=$install/include
export BERKELEYDB_LIB=$install/lib
export PKG_CONFIG_PATH=$install/lib/pkgconfig
[ -e $install/bin/cpanm ] || wget --no-check-certificate -O $install/bin/cpanm cpanmin.us && chmod 755 $install/bin/cpanm

cpanm   XML::LibXML \
        BerkeleyDB \
        Template \
        Proc::Daemon \
        Crypt::DES \
        Crypt::Rijndael \
        Digest::HMAC \
        Digest::SHA1 \
        Net::SNMP \
        URI::Escape \
        Date::Parse
