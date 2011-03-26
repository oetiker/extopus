#!/usr/bin/perl -w

use FindBin;
use lib $FindBin::Bin.'/../../thirdparty/lib/perl5';

use AnyEvent::CouchDB;
#use Store::CouchDB;

#my $db = Store::CouchDB->new(host => 'localhost',
#                             db   => 'extopus',
#                             debug => sub { 0 } );
my $couch = couch();
my $db = $couch->db('extopus');
#$db->create->recv;

$db->save_doc({
    _id => '_design/application',
    views => {
        tree => {
            map => <<MAP_END,
function(doc){
    if (doc.type == 'node'){
        emit([doc.town,doc.address,doc.floor,doc.vendor,doc.product,doc.release,doc.device],1)
    }
}
MAP_END
            reduce => <<REDUCE_END,
function(key, values, rereduce) {    
    return sum(values)
}
REDUCE_END
        }
    }
})->recv;
