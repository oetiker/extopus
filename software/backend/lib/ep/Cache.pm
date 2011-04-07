package ep::Cache;

=head1 NAME

ep::Cache - extopus data cache

=head1 SYNOPSIS

 use ep::Cache;

 my $es = ep::Cache->new(
    cacheKey => 'unique name for the store',
    trees => {
        Location => [ qw(country state city address floor room) ],
        Customer => [ qw(customer country state city address) ]
    },
    fullText => [ qw(country city address product room ip) ],     
 );

 $es->add({
    key => value,
    ...
 });

 my @nodeIds = $es->search('expression',start,limit);
 
 my @branches = $es->getTree($treeName,[qw(key1 key2)]);
 # [ [ name, nodeid ], ... ]

 my @treeNames = $es->getTreeNames();

 my $node = $es->getNode($nodeId);

=head1 DESCRIPTION

Provide node Cache services to Extopus.

=over

=cut

use strict;
use warnings;
use Mojo::Base -base;

has cacheKey    => sub { 'instance'.int(rand(1000000)) };
has trees       => sub { {} };
has fullText    => sub { [] };

=item B<new>(I<config>)

Create an ep::nodeCache object.

=over

=item B<cacheKey>

An identifier for this cache ... probably the name of the current user. If a cache under this name already exists it gets attached.

=item B<trees>

A hash pointer for a list of tree building configurations.

=item B<fullText>

An array pointer to the keys used in the fulltext search

=back

=cut

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

