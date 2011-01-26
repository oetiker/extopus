#!/usr/sepp/bin/perl-5.12.1 -w

use strict;
use warnings;
use v5.12.1;
use FindBin;
use lib "$FindBin::Bin/../lib";
use lib "$FindBin::Bin/../../../support/lib/perl";
use Mojolicious::Commands;
use ep::MojoApp;

$ENV{MOJO_APP} = ep::MojoApp->new;

# Start commands
Mojolicious::Commands->start;
