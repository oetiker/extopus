package EP::Inventory::base;

=head1 NAME

EP::Inventory::base - base inventory class

=head1 SYNOPSIS

 use EP::Inventory::base;

=head1 DESCRIPTION

The base class for inventory modules.

=cut

use Mojo::Base -base;

=head1 PROPERTIES

=head2 cfg

a hash pointer to the inventory module configuration section

=cut

has 'cfg';

=head2 app

a pointer to the application object

=cut

has 'app';

=head2 user

the current user get set by L<EP::Inventory> before calling the walkInventory method.

=cut

has 'user';

=head1 METHODS

Has all the methods of L<Mojo::base> and the follogin:

=cut

=head2 walkInventory(callback)

Walk the invntory and hand all objects to the cache callback for adding to the cache.

=cut

sub walkInventory {
    die;
}

=head2 getVersion()

show some version for the inventory for extopus to decide if it should reload the data. By default the function returns
a random number, meaning that every time extopus checks, there will be a reload.

=cut

sub getVersion {
    return rand;
}

=head2 $recordHash = buildRecord($dataHash)

Builds a record, using data from the MAP section. Executing snipped as necessary.

=cut

sub buildRecord {
    my $self = shift;    
    my $raw = shift;
    my $map = $self->app->cfg->{MAP};
    my %rec;
    for my $attr ( keys %$map ){
        $rec{$attr} = $map->{$attr}($raw);
    }
    return \%rec;
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

