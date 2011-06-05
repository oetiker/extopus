package ep::Visualizer::TorrusData;

=head1 NAME

ep::Visualizer::TorrusData - pull numeric data associated with torrus data source

=head1 SYNOPSIS

use ep::Visualizer::TorrusData;
my $viz = ep::Visualizer::TorrusData->new();

=head1 DESCRIPTION

Works in conjunction with the Data frontend visualizer. Data can be
presented in tabular form and as a csv download.

This visualizer will match records that have the following attributes:

 torrus.url-prefix
 torrus.nodeid

The visualizer fetches data from torrus through the AGGREGATE_DS rpc call.

It determines further processing by evaluation additional configurable attributes

 *** VISUALIZER: data ***
 module = TorrusData
 selector = data_type
 type = PortTraffic
 name = Port Traffic
 sub_nodes = inbytes, outbytes
 col_name = Avg In, Avg  Out, Total In, Total Out, Max In, Max Out
 col_data = $D{inbytes}{AVG}, $D{inbytes}{AVG}, \
            $D{inbytes}{AVG} * $DURATION / 100 * $D{inbytes}{AVAIL}, \
            $D{outbytes}{AVG} * $DURATION / 100 * $D{outbytes}{AVAIL}, \
            $D{inbytes}{MAX}, 
            $D{outbytes}{MAX}

=cut

use strict;
use warnings;

use Mojo::Base 'ep::Visualizer::base';
use Mojo::Util qw(hmac_md5_sum url_unescape);
use Mojo::URL;
use Mojo::JSON::Any;
use Mojo::UserAgent;
use Mojo::Template;
use Time::Local qw(timelocal_nocheck);

use ep::Exception qw(mkerror);
use POSIX qw(strftime);

my $instance = 0;

has 'hostauth';
has view => 'embedded';
has json        => sub {Mojo::JSON::Any->new};
has 'root';
 => sub { '/torrusCSV_'.($instance++) };

sub new {
    my $self = shift->SUPER::new(@_);
    $self->root('/torrusCSV_'.$self->key);
    # parse some config data
    for my $prop (qw(selector name type sub_nodes col_name col_data)){
        die mkerror(9273, "mandatory property $prop for visualizer module TorrusData is not defined")
            if not defined $self->cfg->{$prop};
    }
    $self->cfg->{col_name} = split /\s*,\s*/, $self->cfg->{col_name};
    $self->cfg->{sub_nodes} = split /\s*,\s*/, $self->cfg->{sub_nodes};
    my $sub = eval 'sub { my $DURATION = shift; my %D = (%{$_[0]}); return [ '.$self->cfg->{col_data} . ' ] }';
    if ($@){
        die mkerror(38734,"Failed to compile $self->cfg->{col_data}"); 
    }
    $self->addProxyRoute();    
    return $self;
}
   
=head2 matchRecord(rec)

can we handle this type of record

=cut

sub matchRecord {
    my $self = shift;
    my $rec = shift;
    for (qw(torrus.nodeid torrus.tree-url)){
        return undef unless defined $rec->{$_};
    };
    return undef it $rec->{$self->cfg->{selector} ne $self->cfg->{type};
    return {
        visualizer => 'data',
        title => $self->cfg->'name',
        arguments => {
            views => [
                { key => 'day', name => 'Daily' },
                { key => 'week', name => 'Weekly' },
                { key => 'month', name => 'Monthly' },
                { key => 'year', name => 'Yearly' }
            ]
        }
    };
}

=head2 getData(tree_url,nodeid,end,interval,count)

use the AGGREGATE_DS rpc call to pull some statistics from the server.

=cut

sub getData {
    my $self = shift;
    my $tree_url = shift;
    my $nodeid = shift;
    my $end = shift;
    my $interval = shift;
    my $count = shift;
    my $url = Mojo::URL->new($tree_url);
    $url->query(
        view=> 'rpc',
        RPCCALL => 'AGGREGATE_DS',
    );
    my %E;
    my @return;
    @E{qw{sec min hour mday mon year wday yday isdst}} = localtime($end);
    for (my $step=0;$step < $count;$step++){
        my $stepStart;
        my $stepEnd;
        my $stepLabel;
        for ($interval){
            /day/ && do { 
                $stepStart = timelocal_nocheck(0,0,0,$E{mday} - $step,@E{qw(mon year)});
                $stepEnd = $end + 24*3600;            
                $stepLabel = strftime("%F",localtime($stepStart+12*3600));
                next;
            };
            /week/ && do {
                $stepStart = timelocal_nocheck(0,0,0,$E{mday} - $step*7 - $E{wday},@E{qw(mon year)});
                $stepEnd = $end + 7*24*3600;            
                $stepLabel = strftime("Week %V, %Y",localtime($stepStart+3.5*24*3600));
                next;
            };
            /month/ && do {
                $stepStart = timelocal_nocheck(0,0,0,1,$E{mon}-$step,$E{year});
                $stepEnd = timelocal_nocheck(23,59,59,-1,$E{mon}-$step+1,$E{year});
                $stepLabel = strftime("%b, %Y",localtime($stepStart+15*24*3600));
                next;
            };
            /year/ && do {
                $stepStart = timelocal_nocheck(0,0,0,1,0,$E{year}-$step);
                $stepEnd = timelocal_nocheck(23,59,59,31,11,$E{year}-$step+1);
                $stepLabel = strftime("%Y",localtime($stepStart+180*24*3600));
                next;
            };
        }
        $url->query({
            Gstart => $stepStart,
            Gend => $stepEnd
        });
        my %data;    
        for my $subNode (@{$self->cfg->{sub_nodes}}){
            $url->query({nodeid=>"$nodeid//$subNode"});
            $self->log->debug("getting ".$url->to_string);
            my $tx = Mojo::UserAgent->new->get($url);
            my $data;
            if (my $res=$tx->success) {
                if ($res->headers->content_type =~ m'application/json'i){
                    my $ret = $self->json->decode($res->body);
                    if ($ret->{success}){
                        $data{$subNode} = $ret->{data};
                } else {
                    $self->log->error("Fetching ".$url->to_string." returns ".$data->{error};
                    die mkerror(89384,"Torrus is not happy with our request: ".$data->{error});
                }
            }
            else {
                $self->log->error("Fetching ".$url->to_string." returns ".$res->headers->content_type);
                die mkerror("unexpected content/type (".$res->headers->content_type."): ".$res->body);
            }
        }
        else {
            my ($msg,$error) = $tx->error;
            $self->log->error("Fetching ".$url->to_string." returns $msg ".($error ||''));
            die mkerror(48877,"fetching data from $nodeid from torrus server: $msg ".($error ||''));        
        }
        push @return, [ $stepLabel, @{$self->cfg->{col_data}($stepEnd - $stepStart,\%data)} ];
    }
    return {
        status => 1,
        data => \@return,
    }
}

=head2 addProxyRoute()

create a proxy route with the given properties of the object

=cut

sub addProxyRoute {
    my $self = shift;
    my $routes = $self->routes;

    $routes->get($self->prefix.$self->root, sub {
        my $ctrl = shift;
        my $req = $ctrl->req;
        my $hash =  $req->param('hash');
        my $nodeid = $req->param('nodeid');
        my $url = $req->param('url');
        my $width = $req->param('width');
        my $height = $req->param('height');
        my $start = $req->param('start');
        my $end = $req->param('end');
        my $format = $req->param('format');
        my $pxReq =  Mojo::URL->new($url);
        my $view = $self->view;
        my $newHash = $self->calcHash($url,$nodeid);
        if ($hash ne $newHash){
            $ctrl->render(
                 status => 401,
                 text => "Supplied hash ($hash) does not match our expectations",
            );
            $self->log->warn("Request for $url?nodeid=$nodeid;view=$view denied ($hash ne $newHash)");
            return;
        }
        my $baseUrl = $pxReq->to_string;
        $pxReq->query(nodeid=>$nodeid,view=>$view,Gwidth=>$width,Gheight=>$height,Gstart=>$start,Gend=>$end);
        if ($self->hostauth){
            $pxReq->query({hostauth=>$self->hostauth});
        }        
        if ($format =~ /pdf$/){
            $pxReq->query({Gimgformat=>'PDF'})
        }
        $self->log->debug("Fetching ".$pxReq->to_string);
        my $tx = $ctrl->ua->get($pxReq);
        if (my $res=$tx->success) {
           my $body = $res->body;
           my $rp = Mojo::Message::Response->new;
           $rp->code(200);
            my $type = $res->headers->content_type;
           $rp->headers->content_type($type);
           if (lc $type eq 'application/pdf'){
               my $name = $nodeid;
               $name =~ s/[^-_0-9a-z]+/_/ig;
               $name .= '-'.strftime('%Y-%m-%d',localtime($start)).'_'.strftime('%Y-%m-%d',localtime($end));               
               $rp->headers->add('Content-Disposition',"attachement; filename=$name.pdf");
           }
           $rp->body($body);
           $ctrl->tx->res($rp);
           $ctrl->rendered;
        }
        else {     
            my ($msg,$error) = $tx->error;
            $ctrl->tx->res->headers->add('X-Remote-Status',($error||'???').': '.$msg);
            $ctrl->render(
                status => 500,
                text => 'Failed to fetch data from backend'
            );
        }
    });
}

=head2 calcHash(ref)

Returns a hash for authenticating access to the ref

=cut

sub calcHash {
    my $self = shift;
    $self->log->debug('HASH '.join(',',@_));    
    my $hash = hmac_md5_sum(join('::',@_),$self->secret);
    return $hash;
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
