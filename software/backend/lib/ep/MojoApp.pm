package ep::MojoApp;
use strict;
use warnings;

# load the two modules to have perl check them
use MojoX::Dispatcher::Qooxdoo::Jsonrpc;
use Mojolicious::Plugin::QooxdooJsonrpc;

use ep::JsonRpcService;

use Mojo::Base 'Mojolicious';

sub startup {
    my $self = shift;

    $self->plugin('qooxdoo_jsonrpc',{
        services => {
            ep => new ep::JsonRpcService()
        }
    });           
}

1;
