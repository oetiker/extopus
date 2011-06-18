#!/bin/bash

export PATH=/usr/pack/perl-ubuntu804amd64-5.12.3-to/bin:$PATH

. `dirname $0`/sdbs.inc


for module in \
    Excel::Writer::XLSX  \
    Spreadsheet::WriteExcel \
; do
    perlmodule $module
done

        
