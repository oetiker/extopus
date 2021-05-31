#!/usr/bin/env perl

use lib qw(); # PERL5LIB
use FindBin;use lib "$FindBin::RealBin/../lib";use lib "$FindBin::RealBin/../thirdparty/lib/perl5"; # LIBDIR
# having a non-C locale for number will wreck all sorts of havoc
# when things get converted to string and back
use POSIX qw(locale_h);
setlocale(LC_NUMERIC, "C");use strict;
use Mojolicious::Commands;

Mojolicious::Commands->start_app('EP');
__END__
