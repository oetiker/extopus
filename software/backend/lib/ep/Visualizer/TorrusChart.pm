package ep::Visualizer::TorrusChart;

=head1 NAME

ep::Visualizer::TorrusChart - provide access to appropriate torrus pages via a proxy

=head1 SYNOPSIS

use ep::Visualizer::TorrusIframe;
my $viz = ep::Visualizer::TorrusIframe->new();

=head1 DESCRIPTION

The proxy will only deliver pages with a valid hash. As it ships html pages,
it can rewrite internal img refs to include appropriate hash keys.

This visualizer will match any records that have the following attributes:

 torrus.tree-url
 torrus.nodeid

in qos mode  you also need

 torrus.qos_enabled

The visualizer allows to configure a template for printing graphs.
It uses the L<Mojo::Template> to render the content server side. Via the %R you have
access to all node properties. Client side the following items will be replaced in the resulting
html prior to displaying it. See L<http://demo.qooxdoo.org/current/apiviewer/#qx.util.format.DateFormat>
for information on date format strings (according to unicode tr35).

 @@SRC@@ the image src  path to the current chart
 @@START(format)@@ Start date of the chart
 @@END(format)@@ End date of the chart
 @@VIEW@@ The selected view

Example configuration snipped

 *** VISUALIZER: chart ***
 module = TorrusChart
 name = Traffic
 mode = traffic
 # mode = qos
 +TxPrintTemplate
 <!doctype html><html>
  <head><title><%= $R{name} $R{location} %></title></head>
  <body>
    <h1><%= $R{name} $R{location} %></h1>
    <h2>@@VIEW@@</h2>
    <div>@@START(yyyy.MM.d)@@ - @@END(yyyy.MM.d)@@</div>
    <p><img src="@@SRC@@"/></p>
  </body>
 </html>

=cut

use strict;
use warnings;

use Mojo::Base 'ep::Visualizer::base';
use Mojo::Util qw(hmac_md5_sum url_unescape);
use Mojo::URL;
use Mojo::JSON::Any;
use Mojo::UserAgent;
use Mojo::Template;

use ep::Exception qw(mkerror);
use POSIX qw(strftime);

has 'hostauth';
has view => 'embedded';
has json        => sub {Mojo::JSON::Any->new};
has 'printtemplate';
has 'root';
has 'mode' => 'traffic';

sub new {
    my $self = shift->SUPER::new(@_);
    $self->root('/torrusChart_'.$self->instance);
    $self->addProxyRoute();
    if ($self->cfg->{mode}){
        $self->mode($self->cfg->{mode});
    }    
    if ($self->cfg->{TxPrintTemplate}){
        my $mt = Mojo::Template->new;
#       $mt->prepend('my $self=shift; my %R = (%{$_[0]});');
        $mt->parse('% my %R = (%{$_[0]});'."\n".$self->cfg->{TxPrintTemplate}{_text});
        $mt->build;
        my $exception = $mt->compile;
        die "Compiling Template: ".$exception if $exception;
        $self->printtemplate($mt);
    }
    return $self;
}
   
=head2 matchRecord(rec)

can we handle this type of record

=cut

sub matchRecord {
    my $self = shift;
    my $rec = shift;
    for (qw(torrus.nodeid torrus.tree-url)){
        return undef unless $rec->{$_};
    };
    if ($self->mode eq 'qos'){
        return undef unless $rec->{'torrus.qos-enabled'};
    };
    my $url = $rec->{'torrus.tree-url'};
    my $leaves;
    if ($self->mode eq 'traffic'){
        $leaves = $self->getLeaves($url,'WALK_LEAVES', {nodeid => $rec->{'torrus.nodeid'}});
    }
    else {
        $leaves = $self->getLeaves($url,'SEARCH_NODEID', {PREFIX => 'qos//'.$rec->{'torrus.nodeid'}});
    }    
    my @nodes;
    for my $token (sort { ($leaves->{$b}{precedence} || 0) <=> ($leaves->{$a}{precedence} || 0) } keys %$leaves){        
        my $leaf = $leaves->{$token};
        next unless ref $leaf; # skip emtpy leaves
        my $nodeid = $leaf->{nodeid} or next; # skip leaves without nodeid
        my $hash = $self->calcHash($url,$nodeid);
        $self->log->debug('adding '.$leaf->{comment},$leaf->{nodeid});
        my $src = Mojo::URL->new();
        $src->path($self->root);
        $src->query(
            hash => $hash,
            nodeid => $nodeid,
            url => $url
        );
        $src->base->path($self->root);
        my $plain_src = $src->to_rel;
        url_unescape $plain_src;
        push @nodes, {
            src => $plain_src,
            title => $leaf->{'cbqos-object-descr'} || $leaf->{comment},
        },
    };
    my $template;
    if ($self->printtemplate){
        $template = $self->printtemplate->interpret($rec)
    }    
    return {
        visualizer => 'chart',
        title => $self->cfg->{title},
        caption => $self->cfg->{caption}($rec),
        arguments => {
            views => \@nodes,
            template => $template
        }
    };
}

=head2 getLeaves(treeurl,nodeid)

pull the list of leaves from torrus 

=cut

sub getLeaves {
    my $self = shift;
    my $tree_url = shift;
    my $rpcCall = shift;
    my $callParams = shift;
    my $url = Mojo::URL->new($tree_url);
    $url->query(
        view=> 'rpc',
        RPCCALL => $rpcCall,
        GET_PARAMS => 'precedence,cbqos-object-descr',
        %$callParams
    );    
    $self->log->debug("getting ".$url->to_string);
    my $tx = Mojo::UserAgent->new->get($url);
    if (my $res=$tx->success) {
        if ($res->headers->content_type =~ m'application/json'i){
            my $ret = $self->json->decode($res->body);
            if ($ret->{success}){
                return $ret->{data};
            } else {
                $self->log->error("Running $rpcCall on ".join(', ',map{"$_: $callParams->{$_}"} keys %$callParams).$ret->{error});
                return {};
            }
        }
        else {
            $self->log->error("Fetching ".$url->to_string." returns ".$res->headers->content_type);
            return {};
        }
    }
    else {
        my ($msg,$error) = $tx->error;
        $self->log->error("Fetching ".$url->to_string." returns $msg ".($error ||''));
        return {};
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
