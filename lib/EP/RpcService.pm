package EP::RpcService;
use Mojo::Base qw(Mojolicious::Plugin::Qooxdoo::JsonRpcController);

use EP::Exception qw(mkerror);
use EP::Cache;
use EP::Visualizer;

=head1 NAME

EP::RpcService - RPC services for ep

=head1 SYNOPSIS

This module gets instantiated by L<EP::MojoApp> and provides backend functionality for Extopus.
It relies on an L<EP::Cache> instance for accessing the data.

=head1 DESCRIPTION

the module provides the following methods

=cut

=head2 allow_rpc_access(method)

is this method accessible?

=cut

our %allow = (
    getConfig => 1,
    getBranch => 1,
    getNodeCount => 1,
    getNodes => 1,
    getNode => 1,
    getVisualizers => 1,
    visualize => 1,
    saveDash => 1,
    getDashList => 1,
    deleteDash => 1,
);

has 'cfg' => sub { 
    shift->app->cfg 
};

has 'visualizer' => sub { 
    shift->app->visualizer;
};

has 'cache' => sub {
    EP::Cache->new(controller => shift);
};

has 'service' => 'ep';

has user => sub {
    my $self = shift;
    $self->cfg->{GENERAL}{default_user}|| $self->session('epUser');
};

has login => sub {
    my $self = shift;
    $self->session('epLogin') || 'base';
};



has 'log' => sub { shift->app->log };

sub allow_rpc_access {
    my $self = shift;
    my $method = shift;
    if (not defined $self->user or ($self->cfg->{GENERAL}{openid_url} and not $self->session('epUser'))) {
       die mkerror(3993,q{Your session has expired. Please re-connect.});
    }
    return $allow{$method}; 
}

=head2 getConfig()

get some gloabal configuration information into the interface

=cut

sub getConfig {
    my $self = shift;
    return {
        treeCols => $self->getTableColumnDef('tree'),
        searchCols => $self->getTableColumnDef('search'),
        frontend => $self->cfg->{FRONTEND},
    }
}

=head2 getTreeBranch(parent)

Get the branches and leaves attachd to the given parent. The root of the tree has the parent id 0.

=cut  

sub getBranch { ## no critic (RequireArgUnpacking)
    my $self = shift;    
    return $self->cache->getBranch(@_); 
}

=head2 getTableColumnDef

Return table column definitions.

=cut

sub getTableColumnDef {
    my $self = shift;
    my $table = shift;
    my $cfg = $self->cfg->{TABLES};
    my $cols = $cfg->{$table};
    die mkerror(34884,"Table type '$table' is not known!") unless defined $cols;
    my $attr = $self->cfg->{ATTRIBUTES};
    return {
        ids => ['__epId', @$cols],
        names => [ 'EpId', map { $attr->{$_} } @$cols ],
        ref $cfg->{"${table}_width"} ? (
            widths  => [1,@{$cfg->{${table}."_width"}}]
        ) : (),
        props => ref $cfg->{"${table}_props"} ? ['H',@{$cfg->{${table}."_props"}}] : [],
    };
}

=head2 getNodeCount(expression)

Get the number of nodes matching filter.

=cut  

sub getNodeCount {  ## no critic (RequireArgUnpacking)
    my $self = shift;
    return $self->cache->getNodeCount(@_);
}

=head2 getNodes(expression,limit,offset)

Get the nodes matching the given filter.

=cut  

sub getNodes {   ## no critic (RequireArgUnpacking)
    my $self = shift;
    return $self->cache->getNodes(@_);
}

=head2 getVisualizers(type,recordId)

return a list of visualizers ready to visualize the given node.
see L<EP::Visualizer::getVisualizers> for details.

=cut

sub getVisualizers {
    my $self = shift;
    my $type = shift;
    my $recId = shift;
    my $record = $self->cache->getNode($recId);
    return $self->visualizer->getVisualizers($type,$record);
}

=head2 visualize(instance,args)

generic rpc call to be forwarere to the rpcService method of the visualizer instance.

=cut

sub visualize {   ## no critic (RequireArgUnpacking)
    my $self = shift;
    my $instance = shift;
    return $self->visualizer->visualize($instance,$self,@_);
}

=head2 saveDash(config,label,id,update)

Save the given dashboard properties. Returns the id associated. If the id is
'null' a new id will be created. If the id is given, but the update time is
different in the dash on file, then a new copy of the dash will be written
to disk and appropriate information returned

Returns:

 { id => x, up => y }

=cut

sub saveDash {
    my $self = shift;
    return $self->cache->saveDash(@_);
}

=head2 deleteDash(id,update)

Remove the give Dashboard from the server if id AND updateTime match. Return
1 on success.

=cut

sub deleteDash {
    my $self = shift;
    return $self->cache->deleteDash(@_);
}

=head2 getDashList(lastUpdate)

Return a list of Dashboards on file, supplying detailed configuration data for those
that changed since lastFetch (epoch time).

 [
    { id => i1, up => x1, cfg => z1 }
    { id => i2, up => x2, cfg => z2 }
    { id => i3 }
 ]

=cut

sub getDashList {
    my $self = shift;
    return $self->cache->getDashList(@_);
}        

1;
__END__

=head1 COPYRIGHT

Copyright (c) 2011 by OETIKER+PARTNER AG. All rights reserved.

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

=head1 AUTHOR

S<Tobias Oetiker E<lt>tobi@oetiker.chE<gt>>

=head1 HISTORY 

 2011-01-25 to Initial

=cut
  
1;

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
