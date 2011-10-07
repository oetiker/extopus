#!/bin/bash

. `dirname $0`/sdbs.inc

if python -V 2>&1 | egrep -q '2.[5-9]'; then
:
else
   simplebuild http://www.python.org/ftp/python/2.7.1 Python-2.7.1.tgz
fi

for module in \
    Mojolicious \
    MojoX::Dispatcher::Qooxdoo::Jsonrpc \
    Config::Grammar \
    SIAM \
    DBD::SQLite \
    JSON::XS \
    Mojo::JSON::Any \
    Excel::Writer::XLSX  \
    Spreadsheet::WriteExcel \
; do
    perlmodule $module
done

        
