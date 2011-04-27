#!/bin/bash

. `dirname $0`/sdbs.inc

for module in \
    Mojolicious \
    MojoX::Dispatcher::Qooxdoo::Jsonrpc \
    Config::Grammar \
    SIAM \
    DBD::SQLite \
    JSON::XS \
    Mojo::JSON::Any \
; do
    perlmodule $module
done

        
