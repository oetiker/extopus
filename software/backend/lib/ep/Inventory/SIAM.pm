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

has 'cfg';
has 'user';
has 'siam';
has 'log';

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
    my $self = shift;
    my $storeCallback = shift;
    my $siam = $self->siam;    
    $self->log->debug('loading nodes for '.$self->user);
    $siam->connect();
    my $user = $siam->get_user($self->user) or do {
        $self->log->debug($self->cfg->{driver}.' has no information on '.$self->user);
        return;
    };
    my $contracts = $siam->get_contracts_by_user_privilege($user, 'ViewContract');
    # my $contracts = $siam->get_all_contracts();
    my $count = 0;
    my $map = $self->cfg->{MAP};
    loading:
    for my $cntr ( @{$contracts} ){
        for my $srv ( @{$cntr->get_services} ){
            for my $unit ( @{$srv->get_service_units} ){
                for my $data ( @{$unit->get_data_elements} ){
                    my $raw_data = {
                        %{$cntr->attributes},
                        %{$srv->attributes},                        
                        %{$unit->attributes},
                        %{$data->attributes},
                    };
                    my $data = { map { $map->{$_} => $raw_data->{$_} } grep !/^_/, keys %$map };
                    $storeCallback->($data);
                    $count++;
                }
            }
        }
    }
    $siam->disconnect();
    $self->log->debug('loaded '.$count.' nodes');
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

