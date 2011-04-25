package ep::MojoApp;
use strict;
use warnings;

# load the two modules to have perl check them
use MojoX::Dispatcher::Qooxdoo::Jsonrpc;
use Mojolicious::Plugin::QooxdooJsonrpc;

use ep::JsonRpcService;
use ep::Config;
use ep::Inventory;

use Mojo::Base 'Mojolicious';

has 'cfg' => sub {
    my $self = shift;
    my $conf = ep::Config->new( 
        file=> $ENV{EXTOPUS_CONF} || $self->home->rel_file('etc/extopus.cfg')
    );
    return $conf->parse_config();
};

sub startup {
    my $self = shift;

    $self->secret($self->cfg->{GENERAL}{mojo_secret});

    my $routes = $self->routes;

    # run /setUser/oetiker to launch the application for a particular user
    $routes->route('/setUser/(:user)')->to(
        cb => sub {
            my $self = shift;
            $self->session(epUser =>  $self->stash('user'));
            $self->redirect_to('/');
        }          
    );

    my $inventory = ep::Inventory->new(cfg=>$self->cfg,log=>$self->app->log);

#   my $urlScheme = ep::UrlScheme->new(cfg=>$self->cfg);

    my $service = ep::JsonRpcService->new(
        cfg => $self->cfg->{GENERAL},
        inventory => $inventory,
        mainKeys => [qw(svc.product_name svcunit.type svcunit.name svcunit.location svcdata.type object.id)],
    );

    $self->plugin('qooxdoo_jsonrpc',{
        services => {
            ep => $service
        }
    }); 

}

1;
