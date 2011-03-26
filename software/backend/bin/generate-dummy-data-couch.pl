#!/usr/bin/perl -w

use FindBin;
use lib $FindBin::Bin.'/../../thirdparty/lib/perl5';

use CouchDB::Client;
#use AnyEvent::CouchDB;
#use Store::CouchDB;

#my $db = Store::CouchDB->new(host => 'localhost',
#                             db   => 'extopus',
#                             debug => sub { 0 } );
#my $couch = couch();
#my $db = $couch->db('extopus');
# $db->create->recv;
my $c = CouchDB::Client->new(uri => 'http://localhost:5984/');
my $db = $c->newDB('extopus');
$db->create unless $c->dbExists('extopus');

my @tree_keys = qw(town address floor vendor product release device);


my $dd = $db->newDesignDoc('_design/application');
$dd->retrieve;
$dd->views({
        tree => {
            map => <<MAP_END,
function(doc){
    if (doc.type == 'node'){
        emit([doc.town,doc.address,doc.floor,doc.vendor,doc.product,doc.release,doc.device],1)
    }
}
MAP_END
            reduce => '_sum',
        },
        search => {
            map => <<MAP_END,
function(doc){
    if (doc.type == 'node'){
        doc.K.forEach(function(tag) {
            emit(tag,1);
        }
    }
}
MAP_END
            reduce => '_sum',
        }
});
$dd->update;

my %tree;

# we will add the indexes back after all the updateing is done
#$nodes->drop_indexes;

#for (@tree_keys){
#    $tree{$_} = $db->get_collection('tk_'.$_);
#    $tree{$_}->ensure_index({k => 1},{unique => 1});
#}

my @town = ('Olten','Bern','Tokyo','Berlin','London','Sidney','Genf','Freiburg','Chur','Altdorf','Cairo');
my @address = ('Center','Markweg','Plaza','Top','Downstreet','Westside','Levi','Town Center','Worf','Albert','Park','Hillside','Old Town');
my @floor = ('Floor 1','Floor 2','Floor 3','Floor 4','Floor 5','Floor 6');
my @vendor = ('Cisco','Zyxel','Linksys','Juniper','3com','GKK','Ascom','Gfeller','Simens','Sanyo','Nokia','Sun','Oracle');
my @product = ('c3945','p33k','d1c4','REX 4','A-3444','C-455','F-42885c','D48873','L32','A783');
my @release = ('v1.2','v22','v1.10.2b.33','v0.2.3','v3','v982','v10.4.2b','9,4,2,11','2010.1','2008.23.32');

sub keyextract {
    my @keys;
    for my $in (@_){
        push @keys, split /\s+/, lc($in);        
    }
    return \@keys;
}

my $eqid = 0;
for (1..1000){
    my @x;
    for (1..100){
        my %map = (
            type => 'node',
            town => $town[rand($#town+1)],
            address => $address[rand($#address+1)],
            floor => $floor[rand($#floor+1)],
            vendor => $vendor[rand($#vendor+1)],
            product => $product[rand($#product+1)],
            release => $release[rand($#release+1)],
            device => sprintf('d-%08d',$eqid++)
        );        
        for (1..rand(16)+1){
            my $port = 'p'.$_;            
            push @x, $db->newDoc(undef,undef,{ %map, port=>$port, K => keyextract(values(%map),$port) });
        }
    }
    print STDERR $#x,' ';
    $db->bulkStore(\@x);
}

#for (@tree_keys){
#    $nodes->ensure_index({$_=>1});
#}

# index the keys
#$nodes->ensure_index( Tie::IxHash->new( _S=>1, map { $_ => 1 } @tree_keys) );
