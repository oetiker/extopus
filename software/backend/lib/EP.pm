package EP;

=head1 NAME

EP - the mojo application starting point

=head1 SYNOPSIS

 use EP;
 use Mojolicious::Commands;

 $ENV{MOJO_APP} = EP->new;
 # Start commands
 Mojolicious::Commands->start;

=head1 DESCRIPTION

Configure the mojo engine to run our application logic as webrequests arrive.

=head1 ATTRIBUTES

=cut

use strict;
use warnings;

# load the two modules to have perl check them
use MojoX::Dispatcher::Qooxdoo::Jsonrpc;
use Mojolicious::Plugin::QooxdooJsonrpc;
use Mojo::URL;
use Mojo::Util qw(hmac_sha1_sum slurp);

use EP::RpcService;
use EP::Config;
use EP::Inventory;
use EP::Visualizer;
use EP::DocPlugin;

use Mojo::Base 'Mojolicious';

=head2 cfg

A hash pointer to the parsed extopus configuraton file. See L<EP::Cfg> for syntax.
The default configuration file is located in etc/extopus.cfg. You can override the
path by setting the C<EXTOPUS_CONF> environment variable.

The cfg property is set automatically on startup.

=cut

has 'cfg_file' => sub { $ENV{EXTOPUS_CONF} || $_[0]->home->rel_file('etc/extopus.cfg' ) };

has 'cfg' => sub {
    my $self = shift;
    my $conf = EP::Config->new( 
        file => $self->cfg_file
    );
    return $conf->parse_config();
};

=head2 prefix

location of the extopus application. This is set to '/app' by default.

=cut

has 'prefix' => '/app';

=head1 METHODS

All  the methods of L<Mojolicious> as well as:

=cut

=head2 startup

Mojolicious calls the startup method at initialization time.

=cut

sub startup {
    my $self = shift;
    my $me = $self;
    my $gcfg = $self->cfg->{GENERAL};
    $self->secret($gcfg->{mojo_secret});
    if ($self->mode ne 'development'){
        $self->log->path($gcfg->{log_file});
        if ($gcfg->{log_level}){    
            $self->log->level($gcfg->{log_level});
        }
    }
    
    $self->hook( before_dispatch => sub {
        my $self = shift;
        my $uri = $self->req->env->{SCRIPT_URI} || $self->req->env->{REQUEST_URI};
        my $path_info = $self->req->env->{PATH_INFO};
        $uri =~ s|/?${path_info}$|/| if $path_info and $uri;
        $self->req->url->base(Mojo::URL->new($uri)) if $uri;
    });
    
    my $inventory = EP::Inventory->new(
        app => $self
    );

    my $visualizer = EP::Visualizer->new(
        app=>$self
    );

    my $service = EP::RpcService->new(
        cfg => $self->cfg,
        log => $self->log,
        visualizer => $visualizer,
    );

    # session is valid for 1 day
    $self->sessions->default_expiration(1*24*3600);
    # prevent our cookie from colliding
    $self->sessions->cookie_name('EP_'.hmac_sha1_sum(slurp($self->cfg_file)));
    # run /setUser/oetiker to launch the application for a particular user
    my $app = $self;
    $self->hook(before_dispatch => sub {
        my $self = shift;
        if ($gcfg->{default_user}){
            $self->session(epUser =>  $gcfg->{default_user});
        }
        
        my $user = $self->session('epUser');
        if ($user){
	    my $cache = EP::Cache->new(
                cacheRoot => $gcfg->{cache_dir},
                user => $user,
                inventory => $inventory,
                treeCols => $service->getTableColumnDef('tree')->{ids},
                searchCols => $service->getTableColumnDef('search')->{ids},
                updateInterval => $gcfg->{update_interval} || 86400,
                log => $app->log,
             );
             $self->stash('epCache' => $cache);
	}
    });

    my $routes = $self->routes;

    if (not $gcfg->{default_user}){
        $routes->get('/setUser/(:user)' => sub {
            my $self = shift;
            $self->session(epUser =>  $self->param('user'));
            $self->redirect_to($me->prefix.'/');
        });
    }

    my $apiDocRoot = $self->home->rel_dir('apidoc');
    if (-d $apiDocRoot){
        my $apiDoc = Mojolicious::Static->new();
        $apiDoc->paths([$apiDocRoot]);
        $routes->get('/apidoc/(*path)' =>  { path => 'index.html' } => sub {
            my $self = shift;
            my $file = $self->param('path') || '';
            $self->req->url->path('/'.$file); # relative paths get appended ... 
            if (not $apiDoc->dispatch($self)){
                $self->render(
                   status => 404,
                   text => $self->req->url->path.' not found'
               );
            }
        });
    }

    $routes->get('/' => sub { shift->redirect_to($me->prefix.'/')});

    $self->plugin('EP::DocPlugin', {
        root => '/doc',
        index => 'EP::Index',
        localguide => $self->cfg->{GENERAL}{localguide},
        template => Mojo::Asset::File->new(
            path=>$self->home->rel_file('templates/doc.html.ep')
        )->slurp,
    }); 

    $self->plugin('qooxdoo_jsonrpc',{
        prefix => $self->prefix,
        services => {
            ep => $service
        }
    }); 
    return 0;
}

1;

__END__

=head1 LICENSE

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.

=head1 COPYRIGHT

Copyright (c) 2011 by OETIKER+PARTNER AG. All rights reserved.

=head1 AUTHOR

S<Tobias Oetiker E<lt>tobi@oetiker.chE<gt>>

=head1 HISTORY

 2010-11-04 to 1.0 first version

=cut

# Emacs Configuration
#
# Local Variables:
# mode: cperl
# eval: (cperl-set-style "PerlStyle")
# mode: flyspell
# mode: flyspell-prog
# End:
#
# vi: sw=4 et
