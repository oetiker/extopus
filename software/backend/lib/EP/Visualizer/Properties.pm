package EP::Visualizer::Properties;

=head1 NAME

EP::Visualizer::Properties - show the record as-is

=head1 SYNOPSIS

 *** VISUALIZER: prop ***
 module=Properties
 title=Properties
 caption="$R{prod} $R{inv_id} $R{device_name}:$R{port}"
 properties = cust,street,city,country,prod,svc_type,data_type

=head1 DESCRIPTION

Matches any record and shows its content. With the properties attribute
you can limit the properties which are shown to the user.

=cut

use strict;
use warnings;

use Mojo::Base 'EP::Visualizer::base';

=head1 METHODS

all the methods from L<EP::Visualizer::base>.

=cut

sub matchRecord {
    my $self = shift;
    my $rec = shift;
    my $cfg = $self->cfg;
    my $attr = $self->app->cfg->{ATTRIBUTES};
    my @list;
    if ($cfg->{properties}){
        my @propList = split /\s*,\s*/, $cfg->{properties};
        @list = map {
            [ ''.($attr->{$_} || $_), defined $rec->{$_} ? "$rec->{$_}" : '-' ]
        } @propList;        
    }
    else {
        @list = map {
            [ ''.($attr->{$_} || $_), defined $rec->{$_} ? "$rec->{$_}" : '-' ]
        } sort { ($attr->{$a} || $a) cmp ($attr->{$b} || $b) } keys %$rec;        
    }
    return {
        visualizer =>  'properties',
        title => $cfg->{title},
        caption => $cfg->{caption}->($rec),
        arguments => \@list,
    };
}

1;

__END__

=back

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

 2010-11-04 to 1.0 first version

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
