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

has 'cfg';
has 'user';
has 'siam';

sub new {
    my $self = shift->SUPER::new(@_);
    my $cfg = $self->cfg;
    $self->siam(SIAM->new({
        Driver => {
            Class => $cfg->{driver},
            Options => {
                datafile => $cfg->{datafile},
                logger => {
                    screen => {
                        log_to => 'STDERR',
                        maxlevel => 'warning',
                        minlevel => 'emergency'
                    }
                }
            }

        },
        Root => {
            Attributes => {
                'siam.enterprise_name' => $cfg->{enterprise_name},
                'siam.enterprise_url' => $cfg->{enterprise_url},
                'siam.enterprise_logo_url' => $cfg->{enterprise_logo_url},
            }
        }        
    }));    
    return $self;
}

=head2 walkInventory(sub { my $hash = shift; ... })

call the data loading function for each data object retrieved from the inventory.

=cut

sub walkInventory {
    my $self = shift;
    my $callback = shift;
    my $siam = $self->siam;    
    my $user = $siam->get_user($self->user);
    my $contracts = $siam->get_contracts_by_user_privilege($user, 'ViewContract');
    $siam->connect();
    for my $cntr ( @{$contracts} ){
        for my $srv ( @{$cntr->get_services} ){
            for my $unit ( @{$srv->get_service_units} ){
                for my $data ( @{$unit->get_data_elements} ){
                    $callback->({
                        %{$cntr->attributes},
                        %{$srv->attributes},                        
                        %{$unit->attributes},
                        %{$data->attributes},
                    });
                }
            }
        }
    }
    $siam->disconnect();
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

