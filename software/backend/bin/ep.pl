#!/usr/bin/env perl

use strict;
use warnings;
use FindBin;
use lib "$FindBin::Bin/../../thirdparty/lib/perl5";
use lib "$FindBin::Bin/../lib";
use Mojolicious::Commands;
use EP::MojoApp;

$ENV{MOJO_APP} = EP::MojoApp->new;

# Start commands
Mojolicious::Commands->start;
