package ep::Inventory::SIAM;

=head1 NAME

ep::Inventory::SIAM - read data from a SIAM connector

=head1 SYNOPSIS

 use ep::Inventory::SIAM;

=head1 DESCRIPTION

Thie ep::Inventory::SIAM grabs information from a SIAM inventory.

=cut

use Mojo::Base 'ep::Inventory::base';
use ep::Exception qw(mkerror);

use SIAM;
use YAML;

has 'user';
has 'siam';

sub new {
    my $self = shift->SUPER::new(@_);
    my $cfg = $self->cfg;
    my $siamCfg =  YAML::LoadFile($cfg->{siam_cfg});
    $siamCfg->{Logger} = $self->log;
    $self->siam(SIAM->new($siamCfg));
    $self->siam->set_log_manager($self->log);
    return $self;
}

=head2 walkInventory(sub { my $hash = shift; ... })

call the data loading function for each data object retrieved from the inventory.

=cut

sub walkInventory {
#    DB::enable_profile();
    $ENV{DBI_PROFILE}=2;
    my $self = shift;
    my $storeCallback = shift;
    my $siam = $self->siam;    
    $self->log->debug('loading nodes for '.$self->user);
    $siam->connect();
    my $user = $siam->get_user($self->user) or do {
        $self->log->debug($self->cfg->{driver}.' has no information on '.$self->user);
        return;
    };
    my %user = (%{$user->attributes});
    my $contracts = $siam->get_contracts_by_user_privilege($user, 'ViewContract');
    # my $contracts = $siam->get_all_contracts();
    my $count = 0;
    my $map = $self->cfg->{MAP};
    loading:
    for my $cntr ( @{$contracts} ){
        my %cntr = (%{$cntr->attributes});
        for my $srv ( @{$cntr->get_services} ){
            my %srv = (%{$srv->attributes});
            for my $unit ( @{$srv->get_service_units} ){
                my %unit = (%{$unit->attributes});
                for my $data ( @{$unit->get_data_elements} ){
                    my %data = (%{$data->attributes});
                    my $device = $data->get_device();
                    my %device = (%{$device->attributes});
                    my $raw_data = {
                        %user,%cntr,%srv, %unit, %data, %device 
                    };
                    my $data = $self->buildRecord($raw_data);
                    $storeCallback->($data);
                    $count++;
                }
            }
        }
    }
    $siam->disconnect();
    $self->log->debug('loaded '.$count.' nodes');
#    DB::disable_profile();
#    DB::finish_profile();
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

