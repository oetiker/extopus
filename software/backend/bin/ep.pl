#!/usr/bin/env perl

use strict;
use warnings;
use FindBin;
use lib "$FindBin::Bin/../thirdparty/lib/perl5";
use lib "$FindBin::Bin/../lib";
use Mojolicious::Commands;

our $VERSION = "0";

Mojolicious::Commands->start_app('EP');
