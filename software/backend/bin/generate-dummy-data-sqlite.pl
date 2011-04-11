#!/usr/bin/perl -w

use FindBin;
use lib $FindBin::Bin.'/../lib';
use lib $FindBin::Bin.'/../../thirdparty/lib/perl5';
use ep::Cache;

my $cache = ep::Cache->new(
    cacheKey => 'sqlite-test-tobi',
    cacheRoot => '/scratch/',
    trees => {
        Geo => [qw(town address floor)],
        Product => [ qw(vendor product release) ]
    }
);

$cache->dbh->do("PRAGMA journal_mode = MEMORY");
$cache->dbh->do("PRAGMA cache_size = 10000");
$cache->dbh->begin_work;

my %tree;

my @town = ('Olten','Bern','Tokyo','Berlin','London','Sidney','Genf','Freiburg','Chur','Altdorf','Cairo');
my @address = ('Center','Markweg','Plaza','Top','Downstreet','Westside','Levi','Town Center','Worf','Albert','Park','Hillside','Old Town');
my @floor = ('Floor 1','Floor 2','Floor 3','Floor 4','Floor 5','Floor 6');
my @vendor = ('Cisco','Zyxel','Linksys','Juniper','3com','GKK','Ascom','Gfeller','Simens','Sanyo','Nokia','Sun','Oracle');
my @product = ('c3945','p33k','d1c4','REX 4','A-3444','C-455','F-42885c','D48873','L32','A783');
my @release = ('v1.2','v22','v1.10.2b.33','v0.2.3','v3','v982','v10.4.2b','9,4,2,11','2010.1','2008.23.32');

my $eqid = 0;
my $id = 0;
my $cnt = 0;
for (1..2000){
    my @x;
    for (1..40){
        my %map = (
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
            $cache->add({ %map, port=>$port });
            $cnt++;
            print STDERR  $cnt."\r" if $cnt % 1000 == 0;
        }
    }
}

$cache->dbh->commit;
