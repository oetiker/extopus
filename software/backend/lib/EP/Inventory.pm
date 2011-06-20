package EP::Inventory;

=head1 NAME

EP::Inventory - inventory manager

=head1 SYNOPSIS

 use EP::Inventory;

 my $inv = EP::Inventory->new(cfg=>$cfg);
 $inv->user('oetiker');
 my $cache = EP::Cache->new(...);
 $inv->walkInventory(sub { $cache->add(shift) });

=head1 DESCRIPTION

The base class for inventory modules.

=cut

use Mojo::Util qw(md5_sum);
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
    for my $entry ( grep /^INVENTORY:/, sort keys %{$self->cfg} ){
        my $drvCfg = $self->cfg->{$entry};
        require 'EP/Inventory/'.$drvCfg->{module}.'.pm';
        do {
            no strict 'refs';
            push @{$self->drivers}, "EP::Inventory::$drvCfg->{module}"->new({cfg=>$drvCfg,log=>$self->log,routes=>$self->routes,secret=>$self->secret});

        }
    }
    return $self;
}

=head2 getVersion

return a md5 hash of all inventory versions

=cut

sub getVersion {
    my $self = shift;
    my $text = '';
    for my $driver (@{$self->drivers}){        
        $driver->user($self->user);
        $text .= ">".$driver->getVersion;
    }
    $self->log->debug("inventory version check: $text");
    return md5_sum($text);
}

=head2 walkInventory(callback)

Walk all the configured inventories and add them to the cache.

=cut

sub walkInventory {
    my $self = shift;
    my $cache = shift;
    my $callback = sub { $cache->add(shift) };
    for my $driver (@{$self->drivers}){        
        if ($driver->cfg->{TREE}){
            $cache->tree($driver->cfg->{TREE}{_text});
        }
        else {
            $cache->tree(sub{[]});
        }
        $driver->user($self->user);
        $driver->walkInventory($callback);
    }
}

1;
__END__

=head1 LICENSE

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.

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

