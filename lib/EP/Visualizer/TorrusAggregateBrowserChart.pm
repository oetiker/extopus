package EP::Visualizer::TorrusAggregateBrowserChart;

=head1 NAME

EP::Visualizer::TorrusAggregateBrowserChart - provide access to aggregate charts

=head1 SYNOPSIS

 *** VISUALIZER: aggregatechart ***
 module = TorrusAggregateBrowserChart
 title = Aggregate Trafic Chart
 caption = $R{report_name}

 +VIEW_SELECTOR_PL
 return undef unless $R{report_type} eq 'Torrus.Port.Aggregate';
 return [
    inbytes => {
        label => 'Input Bytes',
        data => sub { $_[0] * 8 }
    },
    outbytes => {
        label=> 'Output Bytes',
        data => sub { $_[0] * 8 }
    }
 ]

Assuming you had these settings in your +MAP

 report_name = siam.report.name
 report_desc = siam.report.description
 report_def = report_def
 report_type = siam.report.type

=head1 DESCRIPTION

This visualizer will match any records that provide a C<report_def> attribute which contains an
array ref to a set of report data source definition. See the L<EP::Inventory::SIAM> source for details.

The C<VIEW_SELECTOR_PL> defines a callback that gets exectued with the record in question. If it returns undef
the record will not be visualized. Otherwhise an array (!) reference is expected containing alternate key values and hash
references as shown in the config example above. The C<data> key is a function reference called upon incoming data prior to sending
it to the browser. This can be used to massage the data.


=cut

=head1 METHODS

all the methods from L<EP::Visualizer::base>. As well as these:

=cut

use Mojo::Base 'EP::Visualizer::base';
use Mojo::Util qw(url_unescape);
use Mojo::URL;
use Mojo::JSON qw(decode_json);
use Data::Dumper;

use Mojo::UserAgent;
use Mojo::Template;

use EP::Exception qw(mkerror);
use POSIX qw(strftime);

has 'hostauth';
has view => 'embedded';

sub new {
    my $self = shift->SUPER::new(@_);
    if( defined($self->cfg->{hostauth}) ){
        $self->hostauth($self->cfg->{hostauth});
    }
    return $self;
}

=head2 matchRecord(type,args)

can we handle this type of record

=cut


sub matchRecord {
    my $self = shift;
    my $type = shift;
    return unless $type eq 'single';
    my $rec = shift;
    # only work for items with report_def;
    return unless $rec->{report_def} and ref $rec->{report_def} eq 'ARRAY';

    my $cfg = $self->cfg;
    # only work if there is a view selector config
    my $viewSelector = $self->cfg->{VIEW_SELECTOR_PL}{_text}->($rec) or return;

    my $order = [ grep { not ref $_ } @$viewSelector ];
    my $viewMap = { @$viewSelector };

    return {
        visualizer => 'browserchart',
        instance => $self->instance,
        title => $self->cfg->{title},
        caption => $self->caption($rec),
        arguments => {
            recId => $rec->{__epId},
            views => [
                map { {
                        key => $_,
                        title => $viewMap->{$_}{label}
                    } } @$order
            ],
            chart => [
                map { {
                    legend => $_->{legend},
                    color => $_->{color},
                    cmd => 'AREA',
                    stack => 1
                } } @{$rec->{report_def}}
            ],
        }
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
    my $viewSelector = $self->cfg->{VIEW_SELECTOR_PL}{_text}->($rec) or die mkerror(7394,"Invalid Record");
    my $viewMap = { @$viewSelector };
    if (not $viewSelector or not exists $viewMap->{$view} ){
        die mkerror(7394,"Unsupported view");
    }
    my $dataExtract = $viewMap->{$view}{data};
    my $return = [];
    # this is a good candidate for using the eventloop
    # at least locally until all the data is here
    for my $item (@{$rec->{report_def}}){
        my $url = Mojo::URL->new($item->{tree_url});
        $url->query(
            view=> 'rpc',
            RPCCALL => 'TIMESERIES',
            Gstart => int($start),
            Gend => int($end),
            Gstep =>int($step || 1),
            Gmaxrows => 4000,
            DATAONLY => 1,
            nodeid=>$item->{node_id}.'//'.$view
        );
        $self->app->log->debug($url->to_string);
        if (defined($self->hostauth)){
            $url->query({hostauth=>$self->hostauth});
        }
        my $res = Mojo::UserAgent->new->get($url);
        if ($res->is_success) {
            if ($res->headers->content_type =~ m'application/json'i){
                # $self->app->log->debug($res->body);
                my $ret = $res->json;
                if ($ret->{success}){
                    push @$return, {
                        status => 'ok',
                        start => $ret->{data}{start},
                        step => $ret->{data}{step},
                        values => [ map { $dataExtract ? $dataExtract->(@$_) : $_->[0] } @{$ret->{data}{data}} ],
                    };
                    next;
                }
                $self->log->error("Torrus Problem $url: $ret->{error}");
                push @$return, {
                    status => 'failed',
                    message => "Torrus Problem $url: $ret->{error}"
                };
                next;
            }
            push @$return, {
                status => 'failed',
                message => "Faild Fetch $url: Data Type ".$res->headers->content_type,
            };
            next;
        }
        my $error = {message => $res->message};
        push @$return, {
            status => 'failed',
            message => "Faild Fetch $url: $error->{message}",
        };
    }
    return $return
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
