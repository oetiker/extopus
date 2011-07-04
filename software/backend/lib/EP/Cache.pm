package EP::Cache;

=head1 NAME

EP::Cache - extopus data cache

=head1 SYNOPSIS

 use EP::Cache;

 my $cache = EP::Cache->new(
        cacheRoot => $cfg->{GENERAL}{cache_dir},
        user => $user,        
        inventory => $self->inventory,
        treeCols => $self->getTableColumnDef('tree')->{ids},
        searchCols => $self->getTableColumnDef('search')->{ids},
        updateInterval => $cfg->{GENERAL}{update_interval} || 86400,
        log => $self->app->log,
 );
 $self->cache($cache);

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
use Encode;
use EP::Exception qw(mkerror);

=head2 ATTRIBUTES

The cache objects supports the following attributes

=cut

=head3 user

the user name supplied to the inventory plugins

=cut

has user	=> sub { die "cacheKey is a mandatory argument" };

=head3 cacheRoot

path to the cache root directory

=cut

has cacheRoot   => '/tmp/';

=head3 searchCols

array with the attributes to report for search results

=cut

has searchCols  => sub {[]};

=head3 treeCols

array with the attributes to report for tree leave nodes

=cut
 
has treeCols    => sub {[]};

=head3 inventry

the inventory object

=cut

has 'inventory';

=head3 updateInterval

how often should we check if the tree needs updating

=cut

has updateInterval => 1e9;

=head3 log

a pointer to the log object

=cut

has 'log';

=head3 meta

meta information on the cache content

=cut

has 'meta'      => sub { {} };

has encodeUtf8  => sub { find_encoding('utf8') };
has tree        => sub { [] };
has json        => sub {Mojo::JSON::Any->new};

=head2 B<new>(I<config>)

Create an EP::nodeCache object.

=over

=item B<cacheRoot>

Directory to store the cache databases.

=item B<cacheKey>

An identifier for this cache ... probably the name of the current user. If a cache under this name already exists it gets attached.

=item B<tree>

A hash pointer for a list of tree building configurations.

=back

=cut

sub new {
    my $self =  shift->SUPER::new(@_);
    my $path = $self->cacheRoot.'/'.$self->cacheKey.'.sqlite';
    my $dbh = DBI->connect_cached("dbi:SQLite:dbname=$path","","",{
         RaiseError => 1,
         PrintError => 1,
         AutoCommit => 1,
         ShowErrorStatement => 1,
         sqlite_unicode => 1,
    });
    $self->dbh($dbh); 
    do { 
        local $dbh->{RaiseError};
        local $dbh->{PrintError};
        $self->meta({ map { @$_ } @{$dbh->selectall_arrayref("select key,value from meta")||[]}});
    };
    if ($dbh->err and $dbh->err == 1){ # no such table
        $dbh->begin_work;
        $dbh->do("CREATE TABLE meta ( key TEXT PRIMARY KEY, value TEXT)");
        $dbh->commit;        
    } 
    $self->{treeCache} = {};
    $self->{nodeId} = 0;

    if (! $self->meta->{version} or time - $cache->meta->{lastup} > $self->updateInterval ){
        my $oldVersion = $self->meta->{version};
        my $version = $self->inventory->getVersion($user);
        if ($oldVersion || '' ne  $version){
            $dbh->begin_work;
            $dbh->do("PRAGMA synchronous = 0");
            if ($oldVersion){
                $self->dropTables;
            }
            $self->createTables;
            $self->setMeta('version',$version);
            $self->setMeta('lastup',time);
            $self->log->debug("loading nodes into $cfg->{GENERAL}{cache_dir} for $user");
            $self->inventory->walkInventory($self,$self->user);
            $self->log->debug("nodes for ".$self->user." loaded");
            $dbh->commit;
            $dbh->do("PRAGMA synchronous = 1");
        }
    }
    return $self;
}

=head2 createTables

crate the cache tables

=cut

sub createTables {
    my $self = shift;
    my $dbh = $self->dbh;
    $dbh->do("CREATE TABLE branch ( id INTEGER PRIMARY KEY, name TEXT, parent INTEGER )");
    $dbh->do("CREATE INDEX branch_idx ON branch ( parent,name )");
    $dbh->do("CREATE TABLE leaf ( parent INTEGER, node INTEGER)");
    $dbh->do("CREATE INDEX leaf_idx ON leaf (parent )");
    $dbh->do("CREATE VIRTUAL TABLE node USING fts3(data TEXT)");
}

=head2 dropTables

drop data tables

=cut

sub dropTables {
    my $self = shift;
    my $dbh = $self->dbh;
    $dbh->do("DROP TABLE branch");
    $dbh->do("DROP TABLE leaf");
    $dbh->do("DROP TABLE node");            
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

=head2 setMeta(key,value)

save a key value pair to the meta table, replaceing any existing value

=cut

sub setMeta {
    my $self = shift;
    my $key = shift;
    my $value = shift;
    my $dbh = $self->dbh;
    $dbh->do("INSERT OR REPLACE INTO meta (key,value) VALUES (?,?)",{},$key,$value);
    $self->meta->{$key} = $value;
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
    return 0 unless defined $expression;
    my $dbh = $self->dbh;    
    my $re = $dbh->{RaiseError};
    $dbh->{RaiseError} = 0;
    my $answer = (($dbh->selectrow_array("SELECT count(docid) FROM node WHERE data MATCH ?",{},$self->encodeUtf8->encode($expression)))[0]);
    if (my $err = $dbh->errstr){
        $err =~ /malformed MATCH/ ? die mkerror(8384,"Invalid Search expression") : die $dbh->errstr;
    }
    $dbh->{RaiseError} = $re;
    return $answer;
}

    
=head2 getNodes($expression,$limit,$offset)

Return nodes matching the given search term

=cut

sub getNodes {
    my $self = shift;
    my $expression = shift;
    return [] unless defined $expression;
    my $limit = shift || 100;
    my $offset = shift || 0;
    my $dbh = $self->dbh;
    my $sth = $dbh->prepare("SELECT docid,data FROM node WHERE data MATCH ? LIMIT ? OFFSET ?");
    $sth->execute($self->encodeUtf8->encode($expression),$limit,$offset);
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
    my @sortedBranches;
    for my $branch (sort {
        my $l = $a->[1];
        my $r = $b->[1];
        ( $l =~ /^\d+/ and $r =~ /^\d+/ ) ? $l <=> $r : $l cmp $r
    } @$branches){
        $sth->execute($branch->[0]);
        my @leaves;
        while (my ($docid,$row) = $sth->fetchrow_array()){  
            my $data = $self->json->decode($row);    
            $data->{__nodeId} = $docid;
            push @leaves, [ map { $data->{$_} } @{$self->treeCols} ];
        }
        push @$branch, \@leaves;        
        push @sortedBranches, $branch;
    }
    return \@sortedBranches;
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

