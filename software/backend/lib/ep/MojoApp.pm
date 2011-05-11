package ep::MojoApp;
use strict;
use warnings;

# load the two modules to have perl check them
use MojoX::Dispatcher::Qooxdoo::Jsonrpc;
use Mojolicious::Plugin::QooxdooJsonrpc;
use Mojo::URL;

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

    my $gcfg = $self->cfg->{GENERAL};
    $self->secret($gcfg->{mojo_secret});
    if ($self->app->mode ne 'development'){
        $self->log->path($gcfg->{log_file});
        if ($gcfg->{log_level}){    
            $self->log->level($gcfg->{log_level});
        }
    }
    my $routes = $self->routes;

    # run /setUser/oetiker to launch the application for a particular user
    $routes->get('/setUser/(:user)' => sub {
        my $self = shift;
        $self->session(epUser =>  $self->stash('user'));
        $self->redirect_to('/');
    });

    $routes->get('/proxy/(:px_hash)/(*px_target)' => sub {
        my $ctrl = shift;
        my $hash =  $ctrl->stash('px_hash');
        my $target =  $ctrl->stash('px_target');
        my $prefix = 'http://tobi.oetiker.ch/';
        my $url = Mojo::URL->new($prefix.$target);
        $url->query($ctrl->req->params);
        $ctrl->render_later;
        $ctrl->ua->get($url => sub {
            my ($self, $tx) = @_;     
            if (my $res=$tx->success) {                
                if ($res->headers->content_type =~ m'text/html'i){
                    my $dom = $res->dom;
                    $dom->find('img[src]')->each( sub { 
                        my $attrs = shift->attrs;
                        my $old_href = $attrs->{href}; 
                        $attrs->{src} = 'http://www.google.ch/logos/2011/graham11-hp-start.png';
                    });         
                    $res->body($dom->to_xml);
                }
                $ctrl->tx->res($res);
                $ctrl->rendered;
            }
            else {
                my ($msg,$error) = $tx->error;
                $ctrl->tx->res->headers->add('X-Remote-Status',$error.': '.$msg);   
                $ctrl->render(
                    status => 500,
                    text => 'Failed to fetch data from backend'
                );
            }
        });
    });



    my $inventory = ep::Inventory->new(cfg=>$self->cfg,log=>$self->app->log);

#   my $urlScheme = ep::UrlScheme->new(cfg=>$self->cfg);

    my $service = ep::JsonRpcService->new(
        cfg => $self->cfg,
        inventory => $inventory,
        log => $self->log,
    );

    $self->plugin('qooxdoo_jsonrpc',{
        services => {
            ep => $service
        }
    }); 

}

1;
