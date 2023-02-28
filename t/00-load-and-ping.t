#!/usr/bin/env perl
use FindBin;
use lib $FindBin::Bin.'/../thirdparty/lib/perl5';
use lib $FindBin::Bin.'/../lib';


use Test::More;
use Test::Mojo;


use_ok 'EP';

my $t = Test::Mojo->new('EP');

$t->post_ok('/app/jsonrpc', json => {
    id => 1,
    service => 'ep',
    method => 'ping'
})
  ->status_is(200)
  ->content_type_is('application/json; charset=utf-8')
  ->json_is('/error/message' => 'Your session has expired. Please re-connect.');

done_testing();
