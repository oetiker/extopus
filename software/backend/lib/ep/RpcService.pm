package ep::RpcService;

use strict;

use ep::Exception qw(mkerror);
use ep::Cache;

use Mojo::Base -base;

=head1 NAME

ep::RpcService - RPC services for ep

=head1 SYNOPSIS

This module gets instantiated by L<ep::MojoApp> and provides backend functionality for Extopus.
It relies on an L<ep::Cache> instance for accessing the data.

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
);

has 'cfg';
has 'inventory';
has 'visualizer';
has 'contoller';
has 'cache';
has 'log';

sub allow_rpc_access {
    my $self = shift;
    my $method = shift;
    my $user = $self->controller->session('epUser');
    die mkerror(3993,q{Your session has expired. Please re-connect.}) unless defined $user;
    my $cfg = $self->cfg;
    my $cache = ep::Cache->new(
        cacheRoot => $cfg->{GENERAL}{cache_dir},
        cacheKey => $user,
        treeCols => $self->getTableColumnDef('tree')->{ids},
        searchCols => $self->getTableColumnDef('search')->{ids},
    );
    $self->cache($cache);
    $self->inventory->user($user);
    if (! $cache->meta->{version} or time - $cache->meta->{lastup} > ($cfg->{GENERAL}{update_interval} || 86400) ){
        my $oldVersion = $cache->meta->{version};
        my $version = $self->inventory->getVersion();
        if ($oldVersion || '' ne  $version){
            $cache->dbh->begin_work;
            $cache->dbh->do("PRAGMA synchronous = 0");
            if ($oldVersion){
                $cache->dropTables;
            }
            $cache->createTables;
            $cache->setMeta('version',$version);
            $cache->setMeta('lastup',time);
            $self->log->debug("loading nodes into $cfg->{GENERAL}{cache_dir} for $user");
            $self->inventory->walkInventory($cache);
            $self->log->debug("nodes for $user loaded");
            $cache->dbh->commit;
            $cache->dbh->do("PRAGMA synchronous = 1");
        }
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

sub getBranch {
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
        ids => ['__nodeId', @$cols],
        names => [ 'NodeId', map { $attr->{$_} } @$cols ],
        ref $cfg->{"${table}_width"} ? (
            widths  => [1,@{$cfg->{${table}."_width"}}]
        ) : ()
    };
}

=head2 getNodeCount(expression)

Get the number of nodes matching filter.

=cut  

sub getNodeCount {
    my $self = shift;
    return $self->cache->getNodeCount(@_);
}

=head2 getNodes(expression,limit,offset)

Get the nodes matching the given filter.

=cut  

sub getNodes {
    my $self = shift;
    return $self->cache->getNodes(@_);
}

=head2 getVisualizers(nodeId)

return a list of visualizers ready to visualize the given node

=cut

sub getVisualizers {
    my $self = shift;
    my $nodeId = shift;
    my $record = $self->cache->getNode($nodeId);
    return $self->visualizer->getVisualizers($record);
}

=head2 visualize(instance,args)

generic rpc call to be forwarere to the rpcService method of the visualizer instance.

=cut

sub visualize {
    my $self = shift;
    my $instance = shift;
    return $self->visualizer->visualize($instance,@_);
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
