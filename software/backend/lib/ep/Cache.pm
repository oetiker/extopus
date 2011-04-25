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

 $es->getNodes('expression',offset,limit);
 
 $es->getBranches($parent);

 $es->getNode($nodeId);

=head1 DESCRIPTION

Provide node Cache services to Extopus.

=cut

use strict;
use warnings;
use DBI;
use Mojo::Base -base;
use Mojo::JSON::Any;

has cacheKey    => sub { 'instance'.int(rand(1000000)) };
has cacheRoot   => '/tmp/';
has mainKeys    => sub { [] };
has trees       => sub { {} };
has json        => sub {Mojo::JSON::Any->new};
has populated   => 0;
has 'dbh';

=head2 B<new>(I<config>)

Create an ep::nodeCache object.

=over

=item B<cacheRoot>

Directory to store the cache databases.

=item B<cacheKey>

An identifier for this cache ... probably the name of the current user. If a cache under this name already exists it gets attached.

=item B<trees>

A hash pointer for a list of tree building configurations.

=cut

sub new {
    my $self =  shift->SUPER::new(@_);
    my $path = $self->cacheRoot.'/'.$self->cacheKey.'.sqlite';
    my $new = not -r $path;
    my $dbh = DBI->connect_cached("dbi:SQLite:dbname=$path","","",{
         RaiseError => 1,
         PrintError => 1,
         AutoCommit => 1,
         ShowErrorStatement => 1,
    });
    $dbh->do("PRAGMA synchronous = 0");
    $self->dbh($dbh);  
    if ($new){  
        $dbh->do("CREATE TABLE branch ( id INTEGER PRIMARY KEY, name TEXT, parent INTEGER )");
        $dbh->do("CREATE INDEX branch_idx ON branch ( parent,name )");
        $dbh->do("CREATE TABLE leaf ( parent INTEGER, node INTEGER)");
        $dbh->do("CREATE INDEX leaf_idx ON leaf (parent )");
        $dbh->do("CREATE VIRTUAL TABLE node USING fts3(data TEXT)");
    } else {
        $self->populated(1);
    }
    $self->{treeCache} = {};
    return $self;
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
    $dbh->do("INSERT INTO node (data) VALUES (?)",{},$self->json->encode($nodeData));
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
    my $cache = $self->{treeCache};
    for my $treeName (keys %{$self->trees}){          
        my $parent = 0;
        for my $keyName ('root',@{$self->trees->{$treeName}}){                
            my $value = $keyName eq 'root' ? $treeName : $node->{$keyName};
            last unless defined $value;
            my $id;
            if ($cache->{$parent}{$value}){
               $id = $cache->{$parent}{$value};
            }
            else {
                $cache->{$parent}{$value} = $id = $dbh->selectrow_array("SELECT id FROM branch WHERE name = ? AND parent = ?",{},$value,$parent);
                
            }
            if (not $id){
                $dbh->do("INSERT INTO branch (name, parent) VALUES(?,?)",{},$value,$parent);
                $id = $dbh->last_insert_id("","","","");
            }
            $parent = $id;
        }
        $dbh->do("INSERT INTO leaf (node, parent) VALUES(?,?)",{},$nodeId,$parent);
    }
}


=head2 getNodeCount($expression)

how many nodes match the given expression

=cut

sub getNodeCount {
    my $self = shift;
    my $expression = shift;
    my $dbh = $self->dbh;
    return (($dbh->selectrow_array("SELECT count(docid) FROM node WHERE data MATCH ?",{},$expression))[0]);
}

    
=head2 getNodes($expression,$limit,$offset)

Return nodes matching the given search term

=cut

sub getNodes {
    my $self = shift;
    my $expression = shift;
    my $limit = shift || 100;
    my $offset = shift || 0;
    my $dbh = $self->dbh;
    my $sth = $dbh->prepare("SELECT docid,data FROM node WHERE data MATCH ? LIMIT ? OFFSET ?");
    $sth->execute($expression,$limit,$offset);
    my $json = $self->json;
    my @return;
    while (my $row = $sth->fetchrow_hashref){
        my $data = $json->decode($row->{data});
        my $entry = { map { $_ => $data->{$_ } } @{$self->mainKeys}};
        $entry->{__docid} = $row->{docid};
        push @return, $entry;
    }
    return \@return;
}

=head2 getBranch($parent)

Return the data makeing up the branch starting off parent.

 { leaves => [ id1, id2, ... ]
   branches => [ [ id1, name1 ], [id2, name2 ], ... ] }

=cut

sub getBranch {
    my $self = shift;
    my $parent = shift;
    my $dbh = $self->dbh;
    my $sth;

    $sth = $dbh->prepare("SELECT id, name FROM branch WHERE parent = ?");
    $sth->execute($parent);
    my $branches = $sth->fetchall_arrayref([]);

    $sth = $dbh->prepare("SELECT node FROM leaf WHERE parent = ?");
    $sth->execute($parent);
    my $leaves = [ map {$_->[0]} @{$sth->fetchall_arrayref([0])} ];
    return {
        leaves => $leaves,
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

