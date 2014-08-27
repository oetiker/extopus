package EP::Cache;
use strict;
use warnings;
use Data::Dumper;
use EP::Inventory;

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

Provide node Cache services to Extopus. The cache is stored in two SQLite
databases. One for the actual cache and the other one for persistance
information.

=cut


use Mojo::Base -base;
use Carp;
use DBI;
use Mojo::JSON;
use Encode;
use EP::Exception qw(mkerror);

=head2 ATTRIBUTES

The cache objects supports the following attributes

=cut

=head3 controller

the current controller

=cut

has 'controller';

has app => sub { shift->controller->app };

has gcfg => sub { shift->app->cfg->{GENERAL}};

=head3 user

the user name supplied to the inventory plugins

=cut

has user => sub { 
    shift->controller->user;
};

=head3 cacheRoot

path to the cache root directory

=cut

has cacheRoot  => sub {
    shift->gcfg->{cache_dir} || '/tmp/';
};

=head3 searchCols

array with the attributes to report for search results

=cut

has searchCols  => sub {
    shift->controller->getTableColumnDef('search')->{ids}
};

=head3 treeCols

array with the attributes to report for tree leave nodes

=cut
 
has treeCols    => sub {
    shift->controller->getTableColumnDef('tree')->{ids}
};

=head3 inventry

the inventory object

=cut

has inventory => sub {
    EP::Inventory->new(app=>shift->app);
};

=head3 updateInterval

how often should we check if the tree needs updating

=cut

has updateInterval => sub {
    shift->gcfg->{update_interval} || 86400;
};

=head3 log

a pointer to the log object

=cut

has 'log' => sub { shift->app->log };

=head3 meta

meta information on the cache content

=cut

has 'meta'      => sub { {} };

=head3 dbhCa

the db handle used by the cache.

=cut

has 'dbhCa';

=head3 dbhPe

the db handle used by the persistance db.

=cut

has 'dbhPe';

has encodeUtf8  => sub { find_encoding('utf8') };
has tree        => sub { [] };
has json        => sub { Mojo::JSON->new };


=head2 B<new>(I<config>)

Create an EP::nodeCache object.

=over

=item B<cacheRoot>

Directory to store the cache databases.

=item B<user>

An identifier for this cache ... probably the name of the current user. If a cache under this name already exists it gets attached.

=item B<tree>

A hash pointer for a list of tree building configurations.

=back

=cut

sub _connect {
    my $self = shift;
    my $suffix = shift;
    my $path = $self->cacheRoot.'/'.$self->user.'_'.$suffix.'.sqlite';
    # $self->log->debug("connecting to sqlite cache $path");
    my $dbh = DBI->connect_cached("dbi:SQLite:dbname=$path","","",{
         RaiseError => 1,
         PrintError => 1,
         AutoCommit => 1,
         ShowErrorStatement => 1,
         sqlite_unicode => 1,
    });
    return $dbh;
}
sub new {
    my $self =  shift->SUPER::new(@_);
    $self->dbhCa(my $dbc = $self->_connect('cache'));
    $self->dbhPe(my $dbp = $self->_connect('persistant'));
    do { 
        local $dbc->{RaiseError} = undef;
        local $dbc->{PrintError} = undef;
        $self->meta({ map { @$_ } @{$dbc->selectall_arrayref("select key,value from meta")||[]} });
    };
    $self->{treeCache} = {};
    my $user = $self->user;
    if ((not $self->meta->{version}) 
        or ( time - ($self->meta->{lastup}||0) > $self->updateInterval )
        or $ENV{EXTOPUS_FORCE_REPOPULATION} ){
        my $populatorPid = $self->meta->{populatorPid};
        if ($populatorPid and kill 0,$populatorPid){
            $self->log->info("skipping re-population as pid $populatorPid is already at it");
        }
        else {
            my $oldVersion = $self->meta->{version} || '';
            my $version = $self->inventory->getVersion($user);
            $self->log->info("checking inventory version '$version' vs '$oldVersion'");     
            if ( $oldVersion  ne  $version){
                $self->setMeta('populatorPid',$$) if $oldVersion;
                $self->log->info("loading nodes into ".$self->cacheRoot." for $user");
                $self->dropTables;
                $self->createTables;
                $self->setMeta('populatorPid',$$);
                $dbc->do("PRAGMA synchronous = 0");
                $dbc->begin_work;
                $dbp->begin_work;
                $self->setMeta('version',$version);
                $self->setMeta('populatorPid',$$);
                $self->inventory->walkInventory($self,$self->user);
                $self->log->debug("nodes for ".$self->user." loaded");
                $dbc->commit;
                $dbp->commit;
                $dbc->do("VACUUM");
                $dbc->do("PRAGMA synchronous = 1");
                $self->setMeta('populatorPid','');    
            } 
            else {
                $self->log->info("no re-population required, cache is current");            
            }
            $self->setMeta('lastup',time);
        }
    }
    return $self;
}

=head2 createTables

crate the cache tables

=cut

sub createTables {
    my $self = shift;
    my $dbc = $self->dbhCa;
    my $dbp = $self->dbhPe;
    # cache tables
    $dbc->do("CREATE TABLE branch ( id INTEGER PRIMARY KEY, name TEXT, parent INTEGER )");
    $dbc->do("CREATE INDEX branch_idx ON branch ( parent,name )");
    $dbc->do("CREATE TABLE leaf ( parent INTEGER, node INTEGER)");
    $dbc->do("CREATE INDEX leaf_idx ON leaf (parent )");
    $dbc->do("CREATE VIRTUAL TABLE node USING fts3(data TEXT)");
    $dbc->do("CREATE TABLE IF NOT EXISTS meta ( key TEXT PRIMARY KEY, value TEXT)");

    # persistance tables
    $dbp->do("CREATE TABLE IF NOT EXISTS stable (numid INTEGER PRIMARY KEY, textkey TEXT)");
    $dbp->do("CREATE UNIQUE INDEX IF NOT EXISTS stable_idx ON stable(textkey)");
    $dbp->do("CREATE TABLE IF NOT EXISTS dash (numid INTEGER PRIMARY KEY, lastupdate INTEGER, label TEXT, config TEXT)");
    $dbp->do("CREATE INDEX IF NOT EXISTS dash_idx ON dash(lastupdate)");    
    return;
}

=head2 dropTables

drop data tables

=cut

sub dropTables {
    my $self = shift;
    my $dbh = $self->dbhCa;
    $dbh->do("DROP TABLE IF EXISTS branch");
    $dbh->do("DROP TABLE IF EXISTS leaf");
    $dbh->do("DROP TABLE IF EXISTS node");            
    return;
}
 
=head2 add({...})

Store a node in the database.

=cut

sub add {
    my $self = shift;
    my $rawNodeId = shift;
    my $nodeData = shift;
    if (not defined $rawNodeId){
        $self->log->warn("Check stableid_pl settings no stableid provided for ".Dumper($nodeData));
        return;
    }
    my $dbc = $self->dbhCa;
    my $dbp = $self->dbhPe;
    my $nodeId = $dbp->selectrow_array("SELECT numid FROM stable WHERE textkey = ?",{},$rawNodeId);
    if (not defined $nodeId){
        $dbp->do("INSERT INTO stable (textkey) VALUES (?)",{},$rawNodeId);
        $nodeId = $dbp->last_insert_id("","","","");
    }
    $self->log->debug("keygen $rawNodeId => $nodeId");
    eval {
        $dbc->do("INSERT INTO node (rowid,data) VALUES (?,?)",{},$nodeId,$self->json->encode($nodeData));
    };
    if ($@){
        $self->log->warn("$@");
        $self->log->warn("Skipping ($rawNodeId)\n\n".Dumper($nodeData));
        return;
    }
    # should use $dbh->last_insert_id("","","",""); but it seems not to work with FTS3 tables :-(
    # glad we are doing the adding in one go so getting the number is pretty simple
    $self->addTreeNode($nodeId,$nodeData);
    return;
}

=head2 setMeta(key,value)

save a key value pair to the meta table, replaceing any existing value

=cut

sub setMeta {
    my $self = shift;
    my $key = shift;
    my $value = shift;
    my $dbh = $self->dbhCa;
    $dbh->do("INSERT OR REPLACE INTO meta (key,value) VALUES (?,?)",{},$key,$value);
    $self->meta->{$key} = $value;
    return;
}

=head2 addTreeNode(nodeId,nodeData)

Update tree with information from the node.

=cut

sub addTreeNode {
    my $self = shift;
    my $nodeId = shift;
    my $node = shift;
    my $dbh = $self->dbhCa;    
    my $cache = $self->{treeCache};
    my $treeData = $self->tree->($node);
    LEAF:
    for my $subTree (@{$treeData}){                  
        my $parent = 0;
        # make sure the whole branche is populated
        for my $value (@{$subTree}){
            next LEAF unless $value;            
        }
        for my $value (@{$subTree}){
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
    return;
}


=head2 getNodeCount($expression)

how many nodes match the given expression

=cut

sub getNodeCount {
    my $self = shift;
    my $expression = shift;
    return 0 unless defined $expression;
    my $dbh = $self->dbhCa;    
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
    my $dbh = $self->dbhCa;
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

Return node matching the given nodeId. Including the __nodeId attribute.

=cut

sub getNode {
    my $self = shift;
    my $nodeId = shift;    
    my $dbh = $self->dbhCa;
    my @row = $dbh->selectrow_array("SELECT data FROM node WHERE docid = ?",{},$nodeId);
    my $json = $self->json;
    my $ret = $json->decode($row[0]);
    $ret->{__nodeId} = $nodeId;
    return $ret;
}

=head2 getBranch($parent)

Return the data makeing up the branch starting off parent.

 [ [ id1, name1, hasKids1, [leaf1, leaf2,...] ],
   [id2, name2, hasKids2, [], ... ] }

=cut

sub getBranch {
    my $self = shift;
    my $parent = shift;
    my $dbh = $self->dbhCa;
    my $sth;


    $sth = $dbh->prepare("SELECT DISTINCT a.id, a.name, b.id IS NOT NULL FROM branch AS a LEFT JOIN branch AS b ON b.parent = a.id WHERE a.parent = ?");
    $sth->execute($parent);
    my $branches = $sth->fetchall_arrayref([]);

    $sth = $dbh->prepare("SELECT docid,data FROM node JOIN leaf ON node.docid = leaf.node AND leaf.parent = ?");
    my @sortedBranches;
    for my $branch (sort {
        my $l = $a->[1];
        my $r = $b->[1];
        ( $l =~ s/^(\d+).*/$1/s and $r =~ s/^(\d+).*/$1/s ) ? $l <=> $r : $l cmp $r
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

=head2 getDashList(lastFetch)

Return a list of Dashboards on file, supplying detailed configuration data for those
that changed since lastFetch (epoch time).

 [
    { id => i1, up => x1, lb => l1, cfg => z1 }
    { id => i2, up => x2, lb => l2, cfg => z2 }
    { id => i3 }
 ]

=cut

sub getDashList {
    my $self = shift;
    my $lastUp = shift // 0;
    my $dbh = $self->dbhPe;
    my @data = @{$dbh->selectall_arrayref("SELECT numid, lastupdate, label, CASE WHEN lastupdate > ? THEN config ELSE 0 END AS cf FROM dash ORDER by label",{},$lastUp)};
    my @ret;
    for (@data){
        my %r;
        $r{id} = $_->[0];
        if ($_->[3]){
           $r{up} = $_->[1];
           $r{lb} = $_->[2];
           $r{cfg} = $self->json->decode($_->[3]);
        }
        push @ret, \%r;
    }
    return \@ret;
}

=head2 saveDash(config,label,id,updateTime)

Save the given dashboard properties. Returns the id associated. If the id is
'null' a new id will be created. If the id is given, but the update time is
different in the dash on file, then a new copy of the dash will be written
to disk and appropriate information returned

Returns:

 { id => x, up => y }

=cut

sub saveDash  {
    my $self = shift;
    my $cfg = $self->json->encode(shift);
    my $label = shift;
    my $id = shift;
    my $updateTime = shift;
    my $dbh = $self->dbhPe;
    my $now = time;
    if ($id){
        my $rows = $dbh->do("UPDATE dash SET lastupdate = ?, label = ?, config = ? WHERE numid = ? and lastupdate = ?",{},
            $now,$label,$cfg,$id,$updateTime);
        if ($rows == 1){
            return { id => $id, up => $now }
        }
    }
    $dbh->do("INSERT INTO dash (lastupdate,label,config) VALUES (?,?,?)",{},$now,$label,$cfg);
    my $newId = $dbh->last_insert_id("","","","");
    return { id => $newId,  up => $now };
}

=head2 deleteDash(id, updateTime)

Remove the said dashboard, but only if the updateTime is correct.

Returns 1 for success and 0 for failure.

=cut

sub deleteDash {
    my $self = shift;
    my $id = shift;
    my $updateTime = shift;
    my $rows = $self->dbhPe->do("DELETE FROM dash WHERE numid = ? and lastupdate = ?",{},$id,$updateTime);
    return $rows == 1;
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

