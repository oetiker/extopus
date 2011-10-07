#!/bin/bash

. `dirname $0`/sdbs.inc

for module in \
    Mojolicious \
    MojoX::Dispatcher::Qooxdoo::Jsonrpc \
    Mojo::Server::FastCGI \
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

        
