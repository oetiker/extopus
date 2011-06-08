package ep::MojoApp;

=head1 NAME

ep::MojoApp - the mojo application starting point

=head1 SYNOPSIS

 use ep::MojoApp;
 use Mojolicious::Commands;

 $ENV{MOJO_APP} = ep::MojoApp->new;
 # Start commands
 Mojolicious::Commands->start;

=head1 DESCRIPTION

Configure the mojo engine to run our application logic as webrequests arrive.

=cut

use strict;
use warnings;

# load the two modules to have perl check them
use MojoX::Dispatcher::Qooxdoo::Jsonrpc;
use Mojolicious::Plugin::QooxdooJsonrpc;
use Mojo::URL;

use ep::RpcService;
use ep::Config;
use ep::Inventory;
use ep::Visualizer;

use Mojo::Base 'Mojolicious';

has 'cfg' => sub {
    my $self = shift;
    my $conf = ep::Config->new( 
        file=> ( $ENV{EXTOPUS_CONF} || $self->home->rel_file('etc/extopus.cfg') )
    );
    return $conf->parse_config();
};

has 'prefix' => '/app';

sub startup {
    my $self = shift;
    my $me = $self;
    my $gcfg = $self->cfg->{GENERAL};
    $self->secret($gcfg->{mojo_secret});
    if ($self->app->mode ne 'development'){
        $self->log->path($gcfg->{log_file});
        if ($gcfg->{log_level}){    
            $self->log->level($gcfg->{log_level});
        }
    }
    my $routes = $self->routes;
    # session is valid for 1 day
    $self->sessions->default_expiration(1*24*3600);
    # run /setUser/oetiker to launch the application for a particular user
    if ($gcfg->{default_user}){
        $self->app->hook(before_dispatch => sub {
            my $self = shift;
            $self->session(epUser =>  $gcfg->{default_user});
        });
    }
    else {
        $routes->get('/setUser/(:user)' => sub {
            my $self = shift;
            $self->session(epUser =>  $self->stash('user'));
            $self->redirect_to($me->prefix.'/');
        });
    }

    $routes->get('/' => sub { shift->redirect_to($me->prefix.'/')});

    my $inventory = ep::Inventory->new(
        cfg=>$self->cfg,
        log=>$self->log,
        routes=>$self->routes,
        secret=>$gcfg->{mojo_secret}
    );

    my $visualizer = ep::Visualizer->new(
        prefix=>$self->prefix,
        cfg=>$self->cfg,
        log=>$self->log,
        routes=>$self->routes,
        secret=>$gcfg->{mojo_secret}
    );

    my $service = ep::RpcService->new(
        cfg => $self->cfg,
        inventory => $inventory,
        visualizer => $visualizer,
        log => $self->log,
    );

    $self->plugin('qooxdoo_jsonrpc',{
        prefix => $self->prefix,
        services => {
            ep => $service
        }
    }); 

}

1;

__END__

=back

=head1 LICENSE

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
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
