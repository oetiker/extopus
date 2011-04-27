#!/bin/bash

. `dirname $0`/sdbs.inc

if [ ! -d "$ORACLE_HOME/libnnz11.so" ]; then
   echo "Make sure to set the ORACLE_HOME variable pointing to the directory where you unpacked instantclient and sdk"   
   exit 1;
fi

perlmodule DBD::Oracle
