#!/bin/bash

. `dirname $0`/sdbs.inc

for module in \
    Mojolicious@3.54 \
    MojoX::Dispatcher::Qooxdoo::Jsonrpc@0.88 \
    Mojo::Server::FastCGI@0.41 \
    Config::Grammar@1.10 \
    SIAM@0.10 \
    DBD::SQLite@1.42 \
    JSON::XS@3.01 \
    Mojo::JSON::Any@0.990104 \
    Excel::Writer::XLSX@0.77  \
    Spreadsheet::WriteExcel@2.40 \
; do
    perlmodule $module
done

#    Devel::NYTProf 
        
