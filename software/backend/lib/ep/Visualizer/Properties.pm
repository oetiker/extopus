package ep::Visualizer::Properties;

=head1 NAME

ep::Visualizer::Plain - show the record as-is

=head1 SYNOPSIS

use ep::Visualizer::Plain;
my $viz = ep::Visualizer::Plain->new();

=head1 DESCRIPTION

Matches any record and shows its content

=cut

use strict;
use warnings;

use Mojo::Base 'ep::Visualizer::base';

  
=head2 matchRecord(rec)

can we handle this type of record

=cut

sub matchRecord {
    my $self = shift;
    my $rec = shift;
    return {
        visualizer =>  'properties',
        title => 'Properties',
        arguments => $rec
    };
}

1;

__END__

=back

=head1 LICENSE

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
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
