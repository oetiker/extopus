package EP::Inventory;

=head1 NAME

EP::Inventory - inventory manager

=head1 SYNOPSIS

 use EP::Inventory;

 my $inv = EP::Inventory->new(cfg=>$cfg);
 my $cache = EP::Cache->new(...);
 $inv->walkInventory($cache,$user);

=head1 DESCRIPTION

Instanciate and manage all configured inventory modules.

=head1 PROPERTIES

=cut

use Mojo::Util qw(md5_sum);
use Mojo::Base -base;

has 'drivers' => sub { [] };

=head2 app

a pointer to the app object

=cut

has 'app';

=head1 METHODS

All methods provided by L<Mojo::Base> plus the following:

=cut

=head2 new(app)

create new inventory manager.


=cut

sub new {
    my $self = shift->SUPER::new(@_);
    for my $entry ( grep /^INVENTORY:/, sort keys %{$self->app->cfg} ){
        my $drvCfg = $self->app->cfg->{$entry};
        require 'EP/Inventory/'.$drvCfg->{module}.'.pm';
        do {
            no strict 'refs';
            push @{$self->drivers}, "EP::Inventory::$drvCfg->{module}"->new({cfg=>$drvCfg,app=>$self->app});

        }
    }
    return $self;
}

=head2 getVersion(user)

return a md5 hash of all inventory versions to see if any of the inventories has new data. We use this information
to decide when to re-inventory the data.

=cut

sub getVersion {
    my $self = shift;
    my $user = shift;
    my $text = '';
    for my $driver (@{$self->drivers}){        
        $text .= ">".$driver->getVersion($user);
    }
    $self->app->log->debug("inventory version check: $text");
    return md5_sum($text);
}

=head2 walkInventory(cache,user)

Walk all the configured inventories and add them to the cache by calling the add method with the available data.

=cut

sub walkInventory {
    my $self = shift;
    my $cache = shift;    
    my $user = shift;
    my $callback = sub { $cache->add(shift) };
    for my $driver (@{$self->drivers}){        
        if ($driver->cfg->{TREE}){
            $cache->tree($driver->cfg->{TREE}{_text});
        }
        else {
            $cache->tree(sub{[]});
        }
        $driver->walkInventory($callback,$user);
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

