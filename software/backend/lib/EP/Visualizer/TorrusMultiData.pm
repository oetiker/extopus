package EP::Visualizer::TorrusMultiData;

=head1 NAME

EP::Visualizer::TorrusMultiData - pull numeric data associated with sellected torrus nodes

=head1 SYNOPSIS

 *** VISUALIZER: multidata ***
 module = TorrusMultiData
 selector = data_type
 type = PortTraffic
 title = Multi Node Traffic Data
 caption = "Multi Node Traffic Review"
 caption_live = "Multi Node Traffic ($C{recCount} records) ".strftime('%Y-%m-%d',localtime($C{endDate})." ($C{interval})"
 skiprec_pl = $R{display} eq 'data_unavailable'
 savename_pl = "multi_node_data"

 sub_nodes = inbytes, outbytes
 col_names = Node, CAR, Avg In, Avg  Out, Total In, Total Out, Max In, Max Out, Coverage
 col_units =   , , Mb/s, Mb/s, Gb, Gb, Mb/s, Mb/s, %
 col_widths = 10,  5, 3  ,    3,    3,  3,  3,    3, 2
 col_data = "$R{prod} $R{inv_id}",$R{car},int($D{inbytes}{AVG}*8/1e4)/1e2, \
           int($D{outbytes}{AVG}*8/1e4)/1e2, \
           int($D{inbytes}{AVG}*8 * $DURATION / 100 * $D{inbytes}{AVAIL}/1e7)/1e2, \
           int($D{outbytes}{AVG}*8 * $DURATION / 100 * $D{outbytes}{AVAIL}/1e7)/1e2, \
           int($D{inbytes}{MAX}*8/1e5)/1e1, \
           int($D{outbytes}{MAX}*8/1e5)/1e1, \
           int($D{inbytes}{AVAIL})


=head1 DESCRIPTION

Works in conjunction with the Data frontend visualizer. Data can be
presented in tabular form, as a csv download and as an Excel Worksheet.

This visualizer will match records that have the following attributes:

 torrus.url-prefix
 torrus.nodeid

The visualizer fetches data from torrus through the AGGREGATE_DS rpc call.

It determines further processing by evaluation additional configurable attributes

=head1 METHODS

all the methods from L<EP::Visualizer::base>. As well as these:               

=cut

use strict;
use warnings;

use Mojo::Base 'EP::Visualizer::TorrusData';
use EP::Exception qw(mkerror);

=head2 matchRecord(type,args)

can we handle multiple records of this type. Later as we evaluate the data all
non matching records will be ignored.

=cut

sub matchRecord {   ## no critic (RequireArgUnpacking)
    my $self = shift;
    my $type = shift;
    my $args = shift;
    $self->app->log->info("match $type $args");
    return unless $type eq 'multi';
    my $ret = $self->SUPER::matchRecord('single',$args);
    if ($ret){
       $ret->{visualizer} = 'multidata';
    }
    return $ret;
}

=head2 getWbName 

determine title and file name for the export

=cut

sub getWbName {  
    my $self = shift; 
    my $cache = shift;
    my $recId = shift;      
    my $data = shift;
    return $data->{title};
}

=head2 getData(recId[],end,interval)

run get data for multiple records

=cut

sub getData {
    my $self = shift;
    my $recIds = shift;
    my $end = shift;
    my $interval = shift;
    if (ref $recIds ne 'ARRAY'){
        $recIds = [ split /,/, $recIds ];
    }
    my @ret;
    my $stamp;
    my $cache = $self->controller->cache;
    for my $recId (@$recIds){
        my $data =  $self->SUPER::getData($recId,$end,$interval,1);
        if ($data->{status}){       
            $stamp =  $data->{stepLabels}[0];
            push @ret, $data->{data}[0];
        } else {
            push @ret, undef;
        };
    }
    return {
        status => 1,
        title => $stamp,
        data => \@ret,
        caption => $self->caption_live({},{interval => $interval, endDate => $end, recCount => scalar @$recIds })
    };
}

=head2 rpcService 

provide rpc data access

=cut

sub rpcService {
    my $self = shift;
    my $arg = shift;
    return $self->getData($arg->{recList},$arg->{endDate},$arg->{interval});
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
S<Roman Plessl E<lt>roman.plessl@oetiker.chE<gt>>

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
