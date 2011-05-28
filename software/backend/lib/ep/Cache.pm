package ep::Cache;

=head1 NAME

ep::Cache - extopus data cache

=head1 SYNOPSIS

 use ep::Cache;

 my $es = ep::Cache->new(
    cacheKey => 'unique name for the store',
    tree => sub { my %R = ( %$_[0] );
            [ [ $R{country}, $R{state} ],
              [ 'Index', uc(substr($R{customer},0,1)), $R{customer} ],
            ] }
    },
 );

 $es->add({
    key => value,
    ...
 });

 $es->getNodes('expression',offset,limit);
 
 $es->getBranch($parent);

=head1 DESCRIPTION

Provide node Cache services to Extopus.

=cut

use strict;
use warnings;
use DBI;
use Mojo::Base -base;
use Mojo::JSON::Any;
use Data::Dumper;

has cacheKey    => sub { 'instance'.int(rand(1000000)) };
has cacheRoot   => '/tmp/';
has tree       => sub { [] };
has json        => sub {Mojo::JSON::Any->new};
has populated   => 0;
has searchCols  => sub {[]};
has treeCols    => sub {[]};

has 'dbh';

=head2 B<new>(I<config>)

Create an ep::nodeCache object.

=over

=item B<cacheRoot>

Directory to store the cache databases.

=item B<cacheKey>

An identifier for this cache ... probably the name of the current user. If a cache under this name already exists it gets attached.

=item B<tree>

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
    $self->dbh($dbh);  
    if ($new){  
        $dbh->begin_work;
        $dbh->do("CREATE TABLE branch ( id INTEGER PRIMARY KEY, name TEXT, parent INTEGER )");
        $dbh->do("CREATE INDEX branch_idx ON branch ( parent,name )");
        $dbh->do("CREATE TABLE leaf ( parent INTEGER, node INTEGER)");
        $dbh->do("CREATE INDEX leaf_idx ON leaf (parent )");
        $dbh->do("CREATE VIRTUAL TABLE node USING fts3(data TEXT)");
        $dbh->commit;
    } else {
        $self->populated(1);
    }
    $dbh->do("PRAGMA synchronous = 0");
    $self->{treeCache} = {};
    $self->{nodeId} = 0;
    return $self;
}
 
=head2 add({...})

Store a node in the database.

=cut

sub add {
    my $self = shift;
    my $nodeData = shift;
    my $dbh = $self->dbh;
    $dbh->do("INSERT INTO node (rowid,data) VALUES (?,?)",{},++$self->{nodeId},$self->json->encode($nodeData));
    # should use $dbh->last_insert_id("","","",""); but it seems not to work with FTS3 tables :-(
    # glad we are doing the adding in one go so getting the number is pretty simple
    $self->addTreeNode($self->{nodeId},$nodeData);
}

=head2 addTreeNode(nodeId,nodeData)

Update tree with information from the node.

=cut

sub addTreeNode {
    my $self = shift;
    my $nodeId = shift;
    my $node = shift;
    my $dbh = $self->dbh;    
    my $cache = $self->{treeCache};
    my $treeData = $self->tree->($node);
    for my $subTree (@{$treeData}){                  
        my $parent = 0;
        for my $value (@{$subTree}){
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
                $cache->{$parent}{$value} = $id;
#                warn "   $keyName ($id): $parent\n";
            }
            $parent = $id;
        }
        $dbh->do("INSERT INTO leaf (node, parent) VALUES(?,?)",{},$nodeId,$parent);
#        warn "   $parent -> $nodeId\n";
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
        my $entry = { map { $_ => $data->{$_} } @{$self->searchCols} };
        $entry->{__nodeId} = $row->{docid};
        push @return, $entry;
    }
    return \@return;
}

=head2 getNode($nodeId)

Return node matching the given nodeId

=cut

sub getNode {
    my $self = shift;
    my $nodeId = shift;    
    my $dbh = $self->dbh;
    my @row = $dbh->selectrow_array("SELECT data FROM node WHERE docid = ?",{},$nodeId);
    my $json = $self->json;
    return $json->decode($row[0]);
}

=head2 getBranch($parent)

Return the data makeing up the branch starting off parent.

 [ [ id1, name1, hasKids1, [leaf1, leaf2,...] ],
   [id2, name2, hasKids2, [], ... ] }

=cut

sub getBranch {
    my $self = shift;
    my $parent = shift;
    my $dbh = $self->dbh;
    my $sth;


    $sth = $dbh->prepare("SELECT DISTINCT a.id, a.name, b.id IS NOT NULL FROM branch AS a LEFT JOIN branch AS b ON b.parent = a.id WHERE a.parent = ?");
    $sth->execute($parent);
    my $branches = $sth->fetchall_arrayref([]);

    $sth = $dbh->prepare("SELECT docid,data FROM node JOIN leaf ON node.docid = leaf.node AND leaf.parent = ?");
    for my $branch (@$branches){
        $sth->execute($branch->[0]);
        my @leaves;
        while (my ($docid,$row) = $sth->fetchrow_array()){  
            my $data = $self->json->decode($row);    
            $data->{__nodeId} = $docid;
            push @leaves, [ map { $data->{$_} } @{$self->treeCols} ];
        }
        push @$branch, \@leaves;        
    }
    return $branches;
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

