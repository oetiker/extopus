package ep::JsonRpcService;

use strict;

use ep::Exception qw(mkerror);
use ep::Cache;

use Mojo::Base -base;

=head1 NAME

ep::JsonRpcService - RPC services for ep

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
    getBranch => 1,
    getNodePropertyKeys => 1,
    getNodeCount => 1,
    getNodes => 1,
    getNode => 1,
);

has 'cfg';
has 'inventory';
has 'mojo_session';
has 'cache';
has 'mainKeys';

sub allow_rpc_access {
    my $self = shift;
    my $method = shift;
    my $user = $self->mojo_session->{'epUser'};
    die mkerror(3993,q{Which user are you talking about?}) unless defined $user;
    my $cache = ep::Cache->new(
        cacheRoot => $self->cfg->{cache_dir},
        cacheKey => $user,
    );
    $self->cache($cache);
    $self->inventory->user($user);
    if (! $cache->populated ){
        $self->inventory->walkInventory(sub{$cache->add(shift)});
        $cache->populated(1);
    }
    return $allow{$method}; 
}
   
=head2 getTreeBranch(parent)

Get the branches and leaves attachd to the given parent. The root of the tree has the parent id 0.

=cut  

sub getBranch {
    my $self = shift;
    return $self->cache->getBranch(@_);
}

=head2 getNodePropertyKeys

Which properties to show in search response

=cut

sub getNodePropertyKeys {
    my $self = shift;
    return $self->mainKeys;
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
