#!/usr/bin/env perl

use strict;
use warnings;
use FindBin;
use lib "$FindBin::Bin/../thirdparty/lib/perl5";
use lib "$FindBin::Bin/../lib";
# use lib qw() # PERL5LIB
use Mojolicious::Commands;
use EP;

our $VERSION = "0";

local $ENV{MOJO_APP} = 'EP';

my $cmds = Mojolicious::Commands->new();
push @{$cmds->namespaces}, 'EP::Command';

# Start commands
$cmds->start;
