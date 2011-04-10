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
 );

 $es->add({
    key => value,
    ...
 });

 my @nodeIds = $es->search('expression',start,limit);
 
 my @branches = $es->getBranches($treeName,$parent);
 # [ [ name, nodeid ], ... ]

 my @treeNames = $es->getTreeNames();

 my $node = $es->getNode($nodeId);

=head1 DESCRIPTION

Provide node Cache services to Extopus.

=cut

use strict;
use warnings;
use DBI;
use Mojo::Base -base;
use Mojo::JSON;

has cacheKey    => sub { 'instance'.int(rand(1000000)) };
has cacheRoot   => '/tmp/';
has trees       => sub { {} };
has fullText    => sub { [] };
has json        => sub { Mojo::JSON->new() };
has 'dbh';

=head2 B<new>(I<config>)

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

sub new {
    my $self =  shift->SUPER::new(@_);
    my $path = $self->cacheRoot.'/'.$self->cacheKey;
    my $new = -r $path;
    my $dbh = DBI->connect_cached("dbi:SQLites:dbname=$path","",{
         RaiseError => 1,
         PrintError => 0,
         AutoCommit => 1,
         ShowErrorStatement => 1,
    });
    $dbh->("PRAGMA synchronous = 0");
    $self->dbh($dbh);  
    if ($new){  
        for my $tree (%{$self->trees}){
            my $treeBranches = $dbh->quote_identifier("branches_$tree");
            my $treeLeaves = $dbh->quote_identifier("leaves_$tree");
            $dbh->do("CREATE TABLE AS $treeBranches ( id INTEGER PRIMARY KEY, name TEXT, parent INTEGER )");
            $dbh->do("CREATE INDEX ".$dbh->quote_identifier("branche_".$tree."_parent_idx")." ON $treeBranches ( parent,name ) ");
            $dbh->do("CREATE TABLE AS $treeLeaves ( node INTEGER, parent INTEGER )");
            $dbh->do("CREATE INDEX ".$dbh->quote_identifier("leaves_".$tree."_parent_idx")." ON $treeLeaves ( parent ) ");
        }
        $dbh->do("CREATE VIRTUAL TABLE node USING fts4(data TEXT)");
    }
}

=head2 getTreeNames()

returns a arrayref to the tree names

=cut

sub getTreeNames {
    my $self = shift;
    return [ keys %{$self->trees} ];
}

=head2 add({...})

Store a node in the database.

=cut

sub add {
    my $self = shift;
    my $nodeData = shift;
    my $dbh = $self->dbh;
    $dbh->do("INSERT INTO node (data) VALUES(?)",{},$self->json->encode($nodeData));
    my $nodeId = $dbh->last_insert_id("","","","");
    $self->addTreeNode($nodeId,$nodeData);
}

=head2 addTreeNode(nodeId,nodeData)

Update all appropriate trees with information from the node.

=cut

sub addTreeNode {
    my $self = shift;
    my $nodeId = shift;
    my $node = shift;
    my $dbh = $self->dbh;
    for my $treeName (keys %{$self->trees}){          
        my $treeBranches = $dbh->quote_identifier("branches_".$treeName); 
        my $parent = 0;
        for my $keyName (@{$self->trees->{$treeName}}){        
            my $value = $node->{$keyName};
            last unless defined $value;
            my $id = $dbh->selectrow_array("SELECT id FROM $treeBranches WHERE name = ? AND parent = ?",{},$value,$parent);
            if (not $id){
                $dbh->do("INSERT INTO $treeBranches (name, parent) VALUES(?,?)",{},$value,$parent);
                $id = $dbh->last_insert_id("","","","");
            }
            $parent = $id;
        }
        my $treeLeaves = $dbh->quote_identifier("leaves_".$treeName);
        $dbh->do("INSERT INTO $treeLeaves (node, parent) VALUES(?,?)",{},$nodeId,$parent);
    }
}


=head2 search($expression,$offset,$limit)

Return nodeIds of documents matching the given search term

=cut

sub search {
    my $self = shift;
    my $expression = shift;
    my $offset = shift || 0;
    my $limit = shift || 100;
    my $dbh = $self->dbh;
    my $sth = $dbh->prepare("SELECT docid FROM node WHERE data MATCH ? LIMIT ? OFFSET ?");
    $sth->execute($expression,$offset,$limit);
    return [ map {$_->[0]} @{$sth->fetchall_arrayref([0])} ];
}

=head2 getBranches($treeName,$parent)

Return the data makeing up the branch starting off parent.

 { nodes => [ id1, id2, ... ]
   branches => [ [ id1, name1 ], [id2, name2 ], ... ] }

=cut

sub getBranches {
    my $self = shift;
    my $treeName = shift;
    my $parent = shift;
    my $dbh = $self->dbh;
    my $sth;

    my $treeBranches = $dbh->quote_identifier("branches_".$treeName);
    $sth = $dbh->prepare("SELECT id, name FROM $treeBranches WHERE parent = ?");
    $sth->execute($parent);
    my $branches = $sth->fetchall_arrayref([]);

    my $treeLeaves = $dbh->quote_identifier("leaves_".$treeName);
    $sth = $dbh->prepare("SELECT node FROM $treeLeaves WHERE parent = ?");
    $sth->execute($parent);
    my $nodes = [ map {$_->[0]} @{$sth->fetchall_arrayref([0])} ];
    return {
        nodes => $nodes,
        branches => $branches
    }     
}

=head2 getNode($nodeId)

Retrieve a node

=cut

sub getNode {
    my $self = shift;
    my $nodeId = shift;
    my $dbh = $self->dbh;
    my $sth = $dbh->prepare("SELECT data FROM node WHERE docid = ?");
    return $self->json->decode($sth->fetchrow_arrayref($nodeId)->[0]);    
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

