package ep::Inventory;

=head1 NAME

ep::Inventory::base - base inventory class

=head1 SYNOPSIS

 use ep::Inventory;

 my $inv = ep::Inventory->new(cfg=>$cfg);
 $inv->user('oetiker');
 my $cache = ep::Cache->new(...);
 $inv->walkInventory(sub { $cache->add(shift) });

=head1 DESCRIPTION

The base class for inventory modules.

=cut

use Mojo::Base -base;

has 'cfg';
has 'drivers' => sub { [] };
has 'user';
has 'log';
has 'routes';
has 'secret';

=head2 new

create new inventory instance

=cut

sub new {
    my $self = shift->SUPER::new(@_);
    for my $entry ( grep /^INVENTORY:/, keys %{$self->cfg} ){
        my $drvCfg = $self->cfg->{$entry};
        require 'ep/Inventory/'.$drvCfg->{module}.'.pm';
        do {
            no strict 'refs';
            push @{$self->drivers}, "ep::Inventory::$drvCfg->{module}"->new({cfg=>$drvCfg,log=>$self->log,routes=>$self->routes,secret=>$self->secret});

        }
    }
    return $self;
}

=head2 walkInventory(callback)

Walk all the configured inventories and add them to the cache.

=cut

sub walkInventory {
    my $self = shift;
    my $callback = shift;
    for my $driver (@{$self->drivers}){
        $driver->user($self->user);
        $driver->walkInventory($callback);
    }
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

