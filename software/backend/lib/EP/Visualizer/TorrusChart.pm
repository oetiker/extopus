package EP::Visualizer::TorrusChart;

=head1 NAME

EP::Visualizer::TorrusChart - provide access to appropriate torrus pages via a proxy

=head1 SYNOPSIS

 *** VISUALIZER: chart ***
 module = TorrusChart
 title = Traffic
 caption = $R{name}
 call = WALK_LEAVES
 call_arg_pl = nodeid => $R{'torrus.nodeid'}
 call_url = torrus.tree-url
  
 skiprec_pl = $R{port.display} eq 'data_unavailable'  
 savename_pl = $R{sap}
 
 extra_params=cbqos-class-map-name,cbqos-parent-name                       
 
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

 +PRINTTEMPLATE_TX
 <!doctype html><html>
  <head><title><%= $R{name} $R{location} %></title></head>
  <body>
    <h1><%= $R{name} $R{location} %></h1>
    <h2>@@VIEW@@</h2>
    <div>@@START(yyyy.MM.d)@@ - @@END(yyyy.MM.d)@@</div>
    <p><img src="@@SRC@@"/></p>
  </body>
 </html>

=head1 DESCRIPTION

The proxy will only deliver pages with a valid hash. As it ships html pages,
it can rewrite internal img refs to include appropriate hash keys.

This visualizer will match any records that provide the C<call_url> property
and don't match C<skip_url_pl>.

The visualizer allows to configure a template for printing graphs.  It uses
the L<Mojo::Template> to render the content server side.  Via the %R you
have access to all node properties.  Client side the following items will be
replaced in the resulting html prior to displaying it.  See
L<http://demo.qooxdoo.org/current/apiviewer/#qx.util.format.DateFormat> for
information on date format strings (according to unicode tr35).

 @@SRC@@ the image src  path to the current chart
 @@SRC(WxH)@@ the image src path to the current chart rendered with W x H
 @@START(format)@@ Start date of the chart
 @@END(format)@@ End date of the chart
 @@VIEW@@ The selected view

Example configuration snipped


=cut

=head1 METHODS

all the methods from L<EP::Visualizer::base>. As well as these:               

=cut

use strict;
use warnings;

use Mojo::Base 'EP::Visualizer::base';
use Mojo::Util qw(url_unescape);
use Mojo::URL;
use Mojo::JSON;

use Mojo::UserAgent;
use Mojo::Template;

use EP::Exception qw(mkerror);
use POSIX qw(strftime);

has 'hostauth';
has view => 'embedded';
has json => sub {Mojo::JSON->new};
has 'printtemplate';
has 'mode' => 'traffic';
has root => sub {'torrusChart_'.shift->instance};

sub new {
    my $self = shift->SUPER::new(@_);
    if( defined($self->cfg->{hostauth}) ){
        $self->hostauth($self->cfg->{hostauth});
    }
    $self->addProxyRoute();
    if ($self->cfg->{mode}){
        $self->mode($self->cfg->{mode});
    }    
    if ($self->cfg->{PRINTTEMPLATE_TX}){
        my $mt = Mojo::Template->new;
#       $mt->prepend('my $self=shift; my %R = (%{$_[0]});');
        # do not report warnings from uninitialized items in print templates
        $mt->parse('% no warnings "uninitialized"; my %R = (%{$_[0]});'."\n".$self->cfg->{PRINTTEMPLATE_TX}{_text});
        $mt->build;
        my $exception = $mt->compile;
        die "Compiling Template: ".$exception if $exception;
        $self->printtemplate($mt);
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
    my $cfg = $self->cfg;
    return if $cfg->{skiprec_pl} and $cfg->{skiprec_pl}->($rec);
    my $url =  $rec->{$cfg->{call_url}};
    return unless $url;
    my $leaves = $self->getLeaves($url,$cfg->{call}, { $cfg->{call_arg_pl}->($rec) });
    my @nodes;
    my $mapper = $self->cfg->{VIEW_MAPPER_PL}{_text};
    for my $token (sort { 
        if (defined $leaves->{$b}{precedence}){
            ($leaves->{$b}{precedence} || 0) <=> ($leaves->{$a}{precedence} || 0) 
        } else {
            ($leaves->{$a}{'cbqos-object-descr'} || $leaves->{$a}{'comment'}) cmp ($leaves->{$b}{'cbqos-object-descr'} || $leaves->{$b}{'comment'})
        }
    } keys %$leaves){        
        my $leaf = $leaves->{$token};
        next unless ref $leaf; # skip emtpy leaves
        my $nodeid = $leaf->{nodeid} or next; # skip leaves without nodeid

        my $title = $leaf->{'cbqos-object-descr'} || $leaf->{comment};
        if ($mapper){
            $title = $mapper->($leaf);
            next unless $title;
        }

        my $hash = $self->calcHash($url,$nodeid);
        $self->app->log->debug('adding '.$title.' - '.$leaf->{nodeid});
        my $src = Mojo::URL->new($self->root);
        $src->query(
            hash => $hash,
            nodeid => $nodeid,
            url => $url,
            recid => $rec->{__epId},
        );

        push @nodes, {
            src => $src->to_string,
            title => $title
        },
    };
    my $template;
    if ($self->printtemplate){
        $template = $self->printtemplate->interpret($rec);
    }    
    return {
        visualizer => 'chart',
        instance => $self->instance,
        title => $self->cfg->{title},
        caption => $self->cfg->{caption}->($rec),
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
    my $extraParams = '';
    my $log = $self->app->log;
    if ($self->cfg->{extra_params}){
         $extraParams= ','.$self->cfg->{extra_params};
         $extraParams=~ s/\s+//g;
    }    
    $url->query(
        view=> 'rpc',
        RPCCALL => $rpcCall,
        GET_PARAMS => 'precedence,cbqos-object-descr'.$extraParams,
        %$callParams
    );
    if (defined($self->hostauth)){
        $url->query({hostauth=>$self->hostauth});
    }        

    $log->debug("getting ".$url->to_string);
    my $tx = Mojo::UserAgent->new->get($url);
    if (my $res=$tx->success) {
        if ($res->headers->content_type =~ m'application/json'i){
            my $ret = $self->json->decode($res->body);
            if ($ret->{success}){
                return $ret->{data};
            } else {
                $log->error("Running $rpcCall on ".join(', ',map{"$_: $callParams->{$_}"} keys %$callParams).$ret->{error});
                return {};
            }
        }
        else {
            $log->error("Fetching ".$url->to_string." returns ".$res->headers->content_type);
            return {};
        }
    }
    else {
        my ($msg,$error) = $tx->error;
        $log->error("Fetching ".$url->to_string." returns $msg ".($error ||''));
        return {};
    }
}

=head2 addProxyRoute()

create a proxy route with the given properties of the object

=cut

sub addProxyRoute {
    my $self = shift;
    my $routes = $self->app->routes;

    $routes->get($self->app->prefix.$self->root, sub {
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
        my $recId = $req->param('recid');
        my $maxlinestep = $req->param('maxlinestep');
        my $pxReq =  Mojo::URL->new($url);
        my $view = $self->view;
        my $newHash = $self->calcHash($url,$nodeid);
        if ($hash ne $newHash){
            $ctrl->render(
                 status => 401,
                 text => "Supplied hash ($hash) does not match our expectations",
            );
            $self->app->log->warn("Request for $url?nodeid=$nodeid;view=$view denied ($hash ne $newHash)");
            return;
        }
        $pxReq->query(nodeid=>$nodeid,view=>$view,Gwidth=>$width,Gheight=>$height,Gstart=>$start,Gend=>$end);
        if (defined($self->hostauth)){
            $pxReq->query({hostauth=>$self->hostauth});
        }        
        if ($maxlinestep){
            $pxReq->query({Gmaxline=>1,Gmaxlinestep=>$maxlinestep});
        }
        if ($format =~ /pdf$/){
            $pxReq->query({Gimgformat=>'PDF'})
        }
        $self->app->log->debug("Fetching ".$pxReq->to_string);
        my $tx = $ctrl->ua->get($pxReq);
        if (my $res=$tx->success) {
           my $body = $res->body;
           my $rp = Mojo::Message::Response->new;
           $rp->code(200);
            my $type = $res->headers->content_type;
           $rp->headers->content_type($type);
           # this should make the client comfortable caching this for a bit
           $rp->headers->last_modified(Mojo::Date->new(time-24*3600));
           if (lc $type eq 'application/pdf'){
               my $cache = EP::Cache->new(controller=>$ctrl,user=>($ctrl->app->cfg->{GENERAL}{default_user}|| $ctrl->session('epUser')));
               my $rec = $cache->getNode($recId);
               my $name = $self->cfg->{savename_pl} ? $self->cfg->{savename_pl}($rec) : $nodeid;
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
    return;
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
