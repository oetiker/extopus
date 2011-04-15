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

#./build_mongodb.sh $install
[ -e $install/bin/cpanm ] || wget --no-check-certificate -O $install/bin/cpanm cpanmin.us && chmod 755 $install/bin/cpanm

cpanm   Mojolicious \
        MojoX::Dispatcher::Qooxdoo::Jsonrpc \
        Config::Grammar \
        SIAM \
        DBD::SQLite \
        Devel::NYTProf \
        JSON::XS \
        Mojo::JSON::Any
#cpanm	Mouse
#cpanm   Any::Moose
#cpanm   MongoDB
#cpanm   Tie::IxHash
#cpanm   AnyEvent::CouchDB
#cpanm   Store::CouchDB
#cpanm   CouchDB::Client
#cpanm   SIAM
#if [ -d /usr/pack/postgresql-8.4.3-za ]; then
#  export POSTGRES_LIB=/usr/pack/postgresql-8.4.3-za/amd64-linux-ubuntu8.04/lib \
#  export POSTGRES_INCLUDE=/usr/pack/postgresql-8.4.3-za/amd64-linux-ubuntu8.04/include
#fi
#cpanm   DBD::Pg
#cpanm CHI
