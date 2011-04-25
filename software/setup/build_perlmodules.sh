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

[ -e $install/bin/cpanm ] || wget --no-check-certificate -O $install/bin/cpanm cpanmin.us && chmod 755 $install/bin/cpanm

cpanm   Mojolicious \
        MojoX::Dispatcher::Qooxdoo::Jsonrpc \
        Config::Grammar \
        SIAM \
        DBD::SQLite \
        Devel::NYTProf \
        JSON::XS \
        Mojo::JSON::Any
