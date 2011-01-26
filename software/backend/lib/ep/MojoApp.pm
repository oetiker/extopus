package ep::MojoApp;
use strict;
use warnings;

use ep::JsonRpcService;

use base 'Mojolicious';

sub startup {
    my $self = shift;

    my $r = $self->routes;

    my $services = {
        ep => new ep::JsonRpcService(),
    };
            
    $r->route('/jsonrpc')->to(
        class       => 'Jsonrpc',
        method      => 'dispatch',
        namespace   => 'MojoX::Dispatcher::Qooxdoo',        
        # our own properties
        services    => $services,        
        debug       => 0,        
    );
    
    $SIG{__WARN__} = sub {
        local $SIG{__WARN__};
        $self->log->info(shift);
    };

    if ($ENV{EP_SOURCE}){
        $self->static->root($self->home->rel_dir('../frontend'));
        $r->get('/' => sub { shift->redirect_to('/source/') });
        $r->get('/source/' => sub { shift->render_static('/source/index.html') });

        my $qx_static = Mojolicious::Static->new();

        $r->route('(*qx_root)/framework/source/(*more)')->to(
            cb => sub {
                my $self = shift;
                my $qx_root = $self->stash('qx_root');
                $qx_static->root('/'.$qx_root);
                $qx_static->prefix('/'.$qx_root);
                return $qx_static->dispatch($self);
            }    
        );
    } else {
        $r->get( '/' => sub { shift->render_static('index.html') });
    }
}

1;
