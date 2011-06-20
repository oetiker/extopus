package EP::MojoApp;

=head1 NAME

EP::MojoApp - the mojo application starting point

=head1 SYNOPSIS

 use EP::MojoApp;
 use Mojolicious::Commands;

 $ENV{MOJO_APP} = EP::MojoApp->new;
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

has 'cfg' => sub {
    my $self = shift;
    my $conf = EP::Config->new( 
        file=> ( $ENV{EXTOPUS_CONF} || $self->home->rel_file('etc/extopus.cfg') )
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
    my $routes = $self->routes;
    # session is valid for 1 day
    $self->sessions->default_expiration(1*24*3600);
    # run /setUser/oetiker to launch the application for a particular user
    if ($gcfg->{default_user}){
        $self->hook(before_dispatch => sub {
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

    my $inventory = EP::Inventory->new(
        app => $self
    );

    my $visualizer = EP::Visualizer->new(
        prefix=>$self->prefix,
        cfg=>$self->cfg,
        log=>$self->log,
        routes=>$self->routes,
        secret=>$self->secret
    );

    my $service = EP::RpcService->new(
        cfg => $self->cfg,
        log => $self->log,
        inventory => $inventory,
        visualizer => $visualizer,
    );

    $self->plugin('EP::DocPlugin',{
        root => '/doc',
        index => 'EP::Index',
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
