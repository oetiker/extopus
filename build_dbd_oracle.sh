#!/bin/bash

. `dirname $0`/sdbs.inc

if [ ! -e "$ORACLE_HOME/libnnz11.so" ]; then
   echo "Make sure to set the ORACLE_HOME variable pointing to the directory where you unpacked instantclient and sdk"   
   exit 1;
fi
export LD_LIBRARY_PATH=$ORACLE_HOME

perlmodule DBI
perlmodule DBD::Oracle
