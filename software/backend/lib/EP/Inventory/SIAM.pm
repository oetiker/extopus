package EP::Inventory::SIAM;
use strict;
use warnings;

=head1 NAME

EP::Inventory::SIAM - read data from a SIAM connector

=head1 SYNOPSIS

 use EP::Inventory::SIAM;

=head1 DESCRIPTION

Import informaton from a L<SIAM> inventory. The module uses the following
configuration information from the main config file.

 *** INVENTORY: siam1 ***
 module=SIAM
 siam_cfg=test.yaml 
 # how to identify this record based on original raw record properties (see MAP section)
 stableid_pl = $R{'torrus.nodeid'}
 # do not add nodes satisfying this condition based on raw record properties (see MAP section)
 skipnode_pl = $R{'cablecom.port.display'} eq 'skip'

 # load all data regardles of user
 load_all = true

 +TREE
 'Location',$R{country}, $R{city}, $R{street}.' '.($R{number}||'')
 $R{cust},$R{svc_type},$R{car}

 +MAP
 prod = siam.svc.product_name
 country = cablecom.svc.loc.country
 city = cablecom.svc.loc.city
 street = $R{'cablecom.svc.loc.address'} . ' ' . ( $R{'cablecom.svc.loc.building_number'} || '')
 cust = siam.contract.customer_name
 svc_type = siam.svc.type
 data_class = siam.svcdata.name
 data_type = siam.svcdata.type
 port = cablecom.port.shortname
 inv_id = siam.svc.inventory_id
 torrus.tree-url = torrus.tree-url
 torrus.nodeid = torrus.nodeid
 car = cablecom.svc.car_name

=cut

use Mojo::Base 'EP::Inventory::base';
use EP::Exception qw(mkerror);
use Mojo::Util qw(md5_sum);

use SIAM;
use YAML;

has 'siam';

=head1 METHODS

Has all the methods and attributes of L<EP::Inventory::base> and the following:

=cut

sub new {
    my $self = shift->SUPER::new(@_);
    my $siamCfg =  YAML::LoadFile($self->cfg->{siam_cfg});
    $siamCfg->{Logger} = $self->app->log;
    $self->siam(SIAM->new($siamCfg)) || die mkerror(289484,"Failed to instanciate SIAM");
    $self->siam->set_log_manager($self->app->log);    
    return $self;
}

=head2 _getContracts

internal ... return a SIAM contract handler

=cut 

sub _getContracts {
    my $self = shift;
    my $siam = $self->siam;    
    my $username = shift;
    my %user = ();
    my $contracts;
    if ($self->cfg->{load_all}){
        $self->app->log->debug('opening ALL contracts');
        $contracts = $siam->get_all_contracts();
    }
    else {
        $self->app->log->debug('open contracts for '.$username);
        my $user = $siam->get_user($username) or do {
            $self->app->log->debug($self->cfg->{driver}.' has no information on user '.$username);
            return [];
        };
        %user = (%{$user->attributes});
        $contracts = $siam->get_contracts_by_user_privilege($user, 'ViewContract');
    }
    return $contracts;    
}

=head2 getVersion(user)

returns an md5 hash of all $cntr->computable('siam.contract.content_md5hash') values.

=cut

sub getVersion {
    my $self = shift;
    my $user = shift;
    my $siam = $self->siam;
    $siam->connect || die mkerror(6234,"Failed to connect SIAM");
    my $contracts = $self->_getContracts($user);
    my $text = '';
    for my $cntr ( @{$contracts} ){
        $text .= $cntr->computable('siam.contract.content_md5hash');
    }
    $siam->disconnect;
    return md5_sum($text);
}

=head2 walkInventory(callback,user)

call the data loading function for each data object retrieved from the inventory.

=cut


    
sub walkInventory {
#   DB::enable_profile();
#   $ENV{DBI_PROFILE}=2;
    my $self = shift;
    my $storeCallback = shift;
    my $user = shift;
    my $siam = $self->siam;    
    $siam->connect;
    my %user = ();
    my $contracts = $self->_getContracts($user);
    my $count = 0;
    my $skip = $self->cfg->{skipnode_pl};
    my $stableId = $self->cfg->{stableid_pl} or die mkerror(3948,"stableid_pl config is not set");

    for my $cntr ( @{$contracts} ){
        my %cntr = (%{$cntr->attributes});
        next unless $cntr{'siam.object.complete'};
        my @srv = @{$cntr->get_services};
        if (not @srv){
            my $raw_rec = {%cntr};
            next if defined $skip and $skip->($raw_rec);
            my $rec = $self->buildRecord($raw_rec);
            $storeCallback->($stableId->($raw_rec),$rec);
            $count++;
            next;
        }
        for my $srv ( @srv ){
            my %srv = (%{$srv->attributes});
            next unless $srv{'siam.object.complete'};
            my @unit = @{$srv->get_service_units};        
            if (not @unit){
                my $raw_rec = {%cntr, %srv};
                next if defined $skip and $skip->($raw_rec);
                my $rec = $self->buildRecord($raw_rec);
                $storeCallback->($stableId->($raw_rec),$rec);
                $count++;
                next;
            }
            for my $unit ( @unit ){
                my %unit = (%{$unit->attributes});
                next unless $unit{'siam.object.complete'};
                my @srvcmpt = @{$unit->get_components};
                if (not @srvcmpt){   
                    my $raw_rec = {%cntr, %srv, %unit};
                    next if defined $skip and $skip->($raw_rec);
                    my $rec = $self->buildRecord($raw_rec);
                    $storeCallback->($stableId->($raw_rec),$rec);
                    $count++;
                    next;
                }
                for my $srvcmpt ( @srvcmpt ){
                    my %srvcmpt = (%{$srvcmpt->attributes});
                    next unless $srvcmpt{'siam.object.complete'};
                    my $raw_rec = {
                        %user,%cntr,%srv, %unit, %srvcmpt 
                    };
                    
                    my $devc = $srvcmpt->get_device_component();
                    if( ref $devc ) {
                        my %devc = (%{$devc->attributes});
                        if ($devc{'siam.object.complete'}){
                            $raw_rec = { %$raw_rec, %devc };
                            my $device = $devc->contained_in();
                            if (ref $device){
                                my %device = (%{$device->attributes});
                                if ($device{'siam.object.complete'}){
                                    $raw_rec = { %$raw_rec, %device };
                                }
                            }
                        }
                    }                                
                    my $rec = $self->buildRecord($raw_rec);
                    $storeCallback->($stableId->($raw_rec),$rec);
                    $count++;
                }
            }
        }
    }
    $siam->disconnect;
    $self->app->log->debug('loaded '.$count.' nodes');
#   DB::disable_profile();
#   DB::finish_profile();
    return;
}

1;
__END__

=head1 COPYRIGHT

Copyright (c) 2011 by OETIKER+PARTNER AG. All rights reserved.

=head1 AUTHOR

S<Tobias Oetiker E<lt>tobi@oetiker.chE<gt>>

=head1 HISTORY

 2011-04-20 to 1.0 first version

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

