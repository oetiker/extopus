#!/usr/sepp/bin/perl-5.12.3-to 

use strict;
use warnings;

use FindBin;
use lib "$FindBin::Bin/../lib";
use lib "$FindBin::Bin/../thirdparty/lib/perl5";

use Spreadsheet::WriteExcel;

# create a workbook
my $workbook = Spreadsheet::WriteExcel->new( 'test.xls' );

#  Add and define a format
my $format = $workbook->add_format(); 
$format->set_bold();    
$format->set_color( 'red' );    
$format->set_align( 'center' );    

# create two worksheet's
my $worksheet1 = $workbook->add_worksheet();
my $worksheet2 = $workbook->add_worksheet( 'test' );

# Write a formatted and unformatted string, row and column notation.
my $col = 0;
my $row = 0;
$worksheet1->write( $row, $col, 'Hi Excel!', $format );
$worksheet1->write( 1, $col, 'Hi Excel!' );

# Write a number and a formula using A1 notation
$worksheet1->write( 'A3', 1.2345 );
$worksheet1->write( 'A4', '=SIN(PI()/4)' );

# close workbook
$workbook->close();



