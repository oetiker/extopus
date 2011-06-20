#!/usr/bin/env perl

use strict;
use warnings;
use FindBin;
use lib "$FindBin::Bin/../../thirdparty/lib/perl5";
use lib "$FindBin::Bin/../lib";
use Mojolicious::Commands;
use ep::MojoApp;

$ENV{MOJO_APP} = ep::MojoApp->new;

# Start commands
Mojolicious::Commands->start;
