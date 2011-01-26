#!/usr/sepp/bin/perl-5.12.1 -w
use 5.12.0;

use FindBin;
use lib $FindBin::Bin.'/../support/lib/perl';

use MongoDB;
use MongoDB::OID;

my $conn = MongoDB::Connection->new;
my $db = $conn->extopus;
my $nodes = $db->nodes;

my @tree_keys = qw(town address floor vendor product release device);

my %tree;

# we will add the indexes back after all the updateing is done
$nodes->drop_indexes;

for (@tree_keys){
    $tree{$_} = $db->get_collection('tk_'.$_);
    $tree{$_}->ensure_index({k => 1},{unique => 1, save => 1});
}

my @town = ('Olten','Bern','Tokyo','Berlin','London','Sidney');
my @address = ('Center','Markweg','Plaza');
my @floor = ('1','z','2','3');
my @vendor = ('Cisco','Zyxel','Linksys');
my @product = ('3945','p33k','1c4','REX');
my @release = ('v1.2','v22','v1.10.2b.33','v0.2.3');

my $eqid = 0;
for (1..2000){
    my @x;
    for (1..100){
        my %map = (
            town => $town[rand($#town+1)],
            address => $address[rand($#address+1)],
            floor => $floor[rand($#floor+1)],
            vendor => $vendor[rand($#vendor+1)],
            product => $product[rand($#product+1)],
            release => $release[rand($#release+1)],
            device => sprintf('d-%8d',$eqid++)
        );        
        for my $tk (@tree_keys){
            $tree{$tk}->insert({k=>$map{$tk}}) if $map{$tk};
        }
        for (1..rand(16)+1){
            my $port = 'p'.$_;
            push @x, { %map, port=>$port};
        }
    }
    $nodes->batch_insert(\@x);
}

for (@tree_keys){
    $nodes->ensure_index({$_=>1});
}
