#!/usr/bin/env perl 

# dump one record from siam to see which properties are available and what
# values they could hold

use strict;
use warnings;
use FindBin;
use lib "$FindBin::Bin/../lib";
use lib "$FindBin::Bin/../thirdparty/lib/perl5";
# use lib qw() # PERL5LIB
use Encode;
use SIAM;
use YAML;
use EP::Config;

my $cfg = EP::Config->new( 
   file=> ( $ENV{EXTOPUS_CONF} || "$FindBin::Bin/../etc/extopus.cfg" )
)->parse_config();

my $siam_cfg = $cfg->{(grep { ref $cfg->{$_} eq 'HASH' and exists $cfg->{$_}{siam_cfg} } keys %$cfg)[0]}{siam_cfg};
my $siam = SIAM->new(YAML::LoadFile($siam_cfg)) || die "Failed to instanciate SIAM";
$siam->connect() || die "Failed to connect SIAM";

#$siam->instantiate_object('SIAM::ServiceDataElement', 'SRVC0001.02.u01.d01')
$Data::Dumper::Sortkeys =1;
my $user = $siam->get_user('100388');
my $contracts= $siam->get_contracts_by_user_privilege($user, 'ViewContract');
    for my $cntr ( @{$contracts} ){
        for my $srv ( @{$cntr->get_services} ){
            for my $unit ( @{$srv->get_service_units} ){
                for my $data ( @{$unit->get_data_elements} ){
                    my $device = $data->get_device();
                    my $x = {
                        %{$user->attributes},
                        %{$cntr->attributes},
                        %{$srv->attributes},                        
                        %{$unit->attributes},
                        %{$data->attributes},
                        %{$device->attributes}
                    };
                    for my $key (sort keys %$x){
                        printf "%30s : %-20s\n",$key,encode('latin1',$x->{$key});
                    }
                    exit 0;
                }
            }
        }
    }
