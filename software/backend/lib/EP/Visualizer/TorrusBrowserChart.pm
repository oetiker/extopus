package EP::Visualizer::TorrusBrowserChart;

=head1 NAME

EP::Visualizer::TorrusBrowserChart - interactive traffic chart

=head1 SYNOPSIS

 *** VISUALIZER: chart ***
 module = TorrusBrowserChart
 title = Traffic
 caption = $R{name}
 call = WALK_LEAVES
 call_arg_pl = nodeid => $R{'torrus.nodeid'}
 call_url = torrus.tree-url

 skiprec_pl = $R{port.display} eq 'data_unavailable'
 savename_pl = $R{sap}

 extra_params=cbqos-class-map-name,cbqos-parent-name
 chart_type = browser

 +VIEW_MAPPER_PL
 # use this section to remap the names provided by torrus to something
 # more 'end user friendly'. Return nothing to supress an entry
 return unless $R{'cbqos-parent-name'} =~ /^cos-po2-cos-SAP\@/;
 my $label;
 for ($R{'cbqos-class-map-name'}){
     $label = 'Voice' if /-vo-/;
     $label = 'Business' if /-bu-/;
     $label = 'Economy' if /-ec-/;
 }
 my $kind;
 for ($R{nodeid}){
     $kind = 'Data' if m|//summary$|;
     $kind = 'Dropped Packets' if m|//droppkt$|;
 }
 return unless $kind and $label;
 return "$label $kind";

=head1 DESCRIPTION

Interactive Traffic charts. Configure them the same way as L<EP::Visuzlizer::TorrusChart>

=cut

=head1 METHODS

all the methods from L<EP::Visualizer::TorrusChart>. As well as these:

=cut

use Mojo::Base 'EP::Visualizer::TorrusChart';
use EP::Exception qw(mkerror);


=head2 matchRecord(type,args)

can we handle this type of record

=cut


sub matchRecord {
    my $self = shift;
    my $return = $self->SUPER::matchRecord(@_) or return;
    $return->{visualizer} = 'browserchart';
    for my $view (@{$return->{arguments}{views}}){
        $view->{key} = $view->{nodeid};
        my $now = time;
        my $ret = $self->getChartData(
            treeUrl => $return->{arguments}{treeUrl},
            start => $now-1,
            end => $now,
            step => $1,
            nodeId => $view->{nodeid}
        );
        my %chart;
        if ($ret->{status} eq 'ok'){
            for my $line ( @{$ret->{data}{rrgraph_args}} ){
                if (my ($cmd,$width,$name,$color,$legend) =
                    ( $line =~ m/^(LINE|AREA)(\d*(?:\.\d+)?):([^#]+)(#[0-9a-f]+)(?::([^\\]*))?/ ) ){
                    $chart{$name} = {
                        legend => $legend,
                        color => $color,
                        cmd => $cmd,
                        width => $width,
                        stack => 0,
                    }
                }
            }
        }
        my @chart;
        for my $name (@{$ret->{data}{names}}){
            push @chart, $chart{$name};
        }
        $view->{chart} = \@chart;
        delete $view->{src};
        delete $view->{nodeid};
    }
    return $return;
}


sub getChartData {
    my $self = shift;
    my %args = @_;

    my $url = Mojo::URL->new($args{treeUrl});
    $url->query(
        view=> 'rpc',
        RPCCALL => 'TIMESERIES',
        Gstart => int($args{start}),
        Gend => int($args{end}),
        Gstep =>int($args{step} || 1),
        Gmaxrows => 4000,
        nodeid=>$args{nodeId}
    );
    $self->app->log->debug('GET '.$url->to_string);
    if (defined($self->hostauth)){
        $url->query({hostauth=>$self->hostauth});
    }
    my $tx = Mojo::UserAgent->new->get($url);
    if (my $res=$tx->success) {
        if ($res->headers->content_type =~ m'application/json'i){
            # $self->app->log->debug($res->body);
            my $ret = eval { $self->json->decode($res->body) };
            if ($@){
                return {
                    status => 'failed',
                    message => "Torrus Problem $url: $@"
                };
            }
            if (ref $ret eq 'HASH'){
                if ($ret->{success}){
                    delete $ret->{success};
                    $ret->{status} = 'ok';
                    return $ret;
                }
                return {
                    status => 'failed',
                    message => "Torrus Problem $url: $ret->{error}"
                };
            }
            return {
                status => 'failed',
                message => "Torrus Problem $url: last resort"
            };
        }
        return {
            status => 'failed',
            message => "Failed to fetch $url: Data Type ".$res->headers->content_type,
        };
    }
    my $error = $tx->error;
    return {
        status => 'failed',
        message => "Failed to fetch $url: $error->{message}",
    };
}

=head2 rpcService

provide data for the browser charts

=cut

sub rpcService {
    my $self = shift;
    my $controller = shift;
    my $arg = shift;
    my $recId = $arg->{recId};
    my $start = $arg->{start};
    my $end = $arg->{end};
    my $step = $arg->{step};
    my $view = $arg->{view};

    my $cache = EP::Cache->new(controller=>$controller);
    my $rec = $cache->getNode($recId);
    my $tree_url =  $rec->{$self->cfg->{call_url}};

    my $return = [];
    my $ret = $self->getChartData(
        treeUrl => $tree_url,
        start => $start,
        end => $end,
        step => $step,
        nodeId => $view
    );

    if ($ret->{status} eq 'ok'){
        my @data;
        my $i = 0;
        for my $name (@{$ret->{data}{names}}){
            push @data, {
                status => $ret->{status},
                start => $ret->{data}{start},
                step => $ret->{data}{step},
                values => [ map { $_->[$i] } @{$ret->{data}{data}} ]
            };
            $i++;
        }
        return \@data,
    }
    return [$ret];
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

 2015-01-06 to 1.0 first version

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
