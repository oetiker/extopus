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

 torrus.server
 torrus.url-prefix
 torrus.nodeid

=cut

use strict;
use warnings;

use Mojo::Base 'ep::Visualizer::base';
use Mojo::Util qw(hmac_md5_sum url_unescape);
use Mojo::URL;
use Mojo::JSON::Any;
use Mojo::UserAgent;
use ep::Exception qw(mkerror);

my $instance = 0;

has 'hostauth';
has view => 'default-rrgraph';
has 'root';
has json        => sub {Mojo::JSON::Any->new};

sub new {
    my $self = shift->SUPER::new(@_);
    $self->root('/torrusChart_'.$instance);
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
    my $url = $rec->{'torrus.tree-url'};
    my $leaves = $self->getLeaves($url,$rec->{'torrus.nodeid'});
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
        my $plain_src = $src->to_string;
        url_unescape $plain_src;
        push @nodes, {
            src => '..'.$plain_src,
            title => $leaf->{comment},
        },
    
    };
    return {
        visualizer => 'chart',
        title => 'Chart',
        arguments => {
            views => \@nodes
        }
    };
}

=head2 getLeaves(treeurl,nodeid)

pull the list of leaves from torrus 

=cut

sub getLeaves {
    my $self = shift;
    my $tree_url = shift;
    my $nodeid = shift;
    my $url = Mojo::URL->new($tree_url);
    $url->query(
        nodeid => $nodeid,
        view=> 'rpc',
        RPCCALL => 'WALK_LEAVES',
        GET_PARAMS => 'precedence',
    );    
    $self->log->debug("getting ".$url->to_string);
    my $tx = Mojo::UserAgent->new->get($url);
    if (my $res=$tx->success) {
        if ($res->headers->content_type =~ m'application/json'i){
            my $ret = $self->json->decode($res->body);
            if ($ret->{success}){
                return $ret->{data};
            } else {
                die mkerror(7534,$ret->{error} || "unknown error while fetching data from torrus");
            }
        }
        else {
            $self->log->error("Fetching ".$url->to_string." returns ".$res->headers->content_type);
            die mkerror(39944,"expected torrus to return and application/json result, but got ".$res->headers->content_type);
        }
    }
    else {
        my ($msg,$error) = $tx->error;
        $self->log->error("Fetching ".$url->to_string." returns $msg ".($error ||''));
        die mkerror(48877,"fetching Leaves for $nodeid from torrus server: $msg ".($error ||''));        
    }
}

=head2 addProxyRoute()

create a proxy route with the given properties of the object

=cut

sub addProxyRoute {
    my $self = shift;
    my $routes = $self->routes;

    $routes->get( $self->root, sub {
        my $ctrl = shift;
        my $req = $ctrl->req;
        my $hash =  $req->param('hash');
        my $nodeid = $req->param('nodeid');
        my $url = $req->param('url');
        my $width = $req->param('width') - 90 ;
        my $height = $req->param('height') - 100;
        my $start = $req->param('start');
        my $end = $req->param('end');
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
        $self->log->debug("Fetching ".$pxReq->to_string);
        my $tx = $ctrl->ua->get($pxReq);
        if (my $res=$tx->success) {
           my $body = $res->body;
           my $rp = Mojo::Message::Response->new;
           $rp->code(200);
           $rp->headers->content_type($res->headers->content_type);
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
