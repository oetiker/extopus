#!/bin/bash
set -e
cd `dirname "$0"`
install=`cd ..;pwd`/thirdparty
[ -d $install ] || mkdir $install
export PERL=perl-5.12.1
./build_dependencie.sh $install
