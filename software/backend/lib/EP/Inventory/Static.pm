package EP::Inventory::Static;
use strict;
use warnings;

=head1 NAME

EP::Inventory::Static - generates data records directly from the extopus config file

=head1 SYNOPSIS

 use EP::Inventory::Static;

=head1 DESCRIPTION

Add records to the extopus cache directly from the config file.


  *** INVENTORY: demo ***
  module=Static 
  stableid_pl = ('Demo:'.$R{a})

  +TREE
  'Demo',$R{a}   

  +DATA_PL
  [{ 
     a   => 'Custom Report',
     b   => 'Hello World
  },
  { 
     a   => 'Peter',
     b   => 'Pan'
  }]

=cut

use Mojo::Base 'EP::Inventory::base';
use EP::Exception qw(mkerror);
use Mojo::Util qw(md5_sum);
use Data::Dumper;

=head1 METHODS

Has all the methods and attributes of L<EP::Inventory::base> and the following:

=cut

=head2 getVersion(user)

returns an md5 hash of the data provided in the config file.

=cut

sub getVersion {
    my $self = shift;
    my $user = shift;
    return md5_sum(Dumper($self->cfg->{DATA_PL}{_text}->({user=>$user})));
}

=head2 walkInventory(callback,user)

call the data loading function for each data object retrieved from the inventory.

=cut


    
sub walkInventory {
    my $self = shift;
    my $storeCallback = shift;
    my $user = shift;
    my $data = $self->cfg->{DATA_PL}{_text}->({user=>$user});
    my $stableId = $self->cfg->{stableid_pl} or die mkerror(3948,"stableid_pl config is not set");
    for my $rec (@$data){
        $storeCallback->($stableId->($rec),$rec);
    }
    return;
}

1;
__END__

=head1 COPYRIGHT

Copyright (c) 2012 by OETIKER+PARTNER AG. All rights reserved.

=head1 AUTHOR

S<Tobias Oetiker E<lt>tobi@oetiker.chE<gt>>

=head1 HISTORY

 2012-03-20 to 1.0 first version

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

