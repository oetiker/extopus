package ep::Inventory::base;

=head1 NAME

ep::Inventory::base - base inventory class

=head1 SYNOPSIS

 use ep::Inventory::base;

=head1 DESCRIPTION

The base class for inventory modules.

=cut

use Mojo::Base -base;

has 'cfg';
has 'log';

=head2 walkInventory(callback)

Walk the invntory and hand all objects to the cache callback for adding to the cache.

=cut

sub walkInventory {
    die;
}

=head2 $recordHash = buildRecord($dataHash)

Builds a record, using data from the MAP section. Executing snipped as necessary.

=cut

sub buildRecord {
    my $self = shift;    
    my $raw = shift;
    my $map = $self->cfg->{MAP};
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

