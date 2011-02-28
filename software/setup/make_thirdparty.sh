#!/bin/bash
set -e
cd `dirname "$0"`
install=`cd ..;pwd`/thirdparty
[ -d $install ] || mkdir $install
export PERL=perl

export PERL_CPANM_HOME="$install"
export PERL_CPANM_OPT="--notest --local-lib $install"
export PATH=$install/bin:$PATH

#./build_mongodb.sh $install
[ -e $install/bin/cpanm ] || curl -L cpanmin.us > $install/bin/cpanm && chmod 755 $install/bin/cpanm

cpanm   Mojolicious
cpanm   MojoX::Dispatcher::Qooxdoo::Jsonrpc
cpanm   Config::Grammar
cpanm	Mouse
cpanm   Any::Moose
cpanm   MongoDB
cpanm   Tie::IxHash