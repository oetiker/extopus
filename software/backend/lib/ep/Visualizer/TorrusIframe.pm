package ep::Visualizer::TorrusIframe;

=head1 NAME

ep::Visualizer::TorrusIframe - provide access to appropriate torrus pages via a proxy

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
use Mojo::Util qw(hmac_md5_sum);
use Mojo::URL;

my $instance = 0;

has 'hostauth';
#has 'view' => 'expanded-dir-html';
has view => 'iframe-rrd';
has 'root';

sub new {
    my $self = shift->SUPER::new(@_);
    $self->root('/torrusIframe_'.$instance);
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
    $url =~ s/psrtorrus/tsrtorrus/i;
    my $nodeid = $rec->{'torrus.nodeid'};
    my $view = $self->view;
    my $hash = $self->calcHash($url,$nodeid,$view);
    my $src = Mojo::URL->new();
    $src->path($self->root);
    $src->query(
          hash => $hash,
          nodeid => $nodeid,
          view => $view,
          url => $url
    );
    return {
        visualizer =>  'iframe',
        arguments => {
            src => '..'.$src->to_rel
        }
    };
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
        my $url = $req->param('url');
        my $pxReq =  Mojo::URL->new($url);        
        my $nodeid = $req->param('nodeid');
        my $view = $req->param('view');
        my $newHash = $self->calcHash($url,$nodeid,$view);
        if ($hash ne $newHash){
            $ctrl->render(
                 status => 401,
                 text => "Supplied hash ($hash) does not match our expectations",
            );
            $self->log->warn("Request for $url?nodeid=$nodeid;view=$view denied ($hash ne $newHash)");
            return;
        }
        my $baseUrl = $pxReq->to_string;
        $pxReq->query(nodeid=>$nodeid,view=>$view);
        if ($self->hostauth){
            $pxReq->query({hostauth=>$self->hostauth});
        }        
        $self->log->debug("Fetching ".$pxReq->to_string);
        my $tx = $ctrl->ua->get($pxReq);
        if (my $res=$tx->success) {
           if ($res->headers->content_type =~ m'text/html'i){
               $self->signImgSrc($baseUrl,$res);
            }
            $ctrl->tx->res($res);
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

=head2 signImgSrc(target,res)

Sign all image urls pointing to our server.

=cut

sub signImgSrc {
    my $self = shift;
    my $pageUrl = Mojo::URL->new(shift);
    my $res = shift;    
    my $dom = $res->dom;
    my $root = $self->root;
    my $changed;
    $dom->find('img[src]')->each( sub {
        my $attrs = shift->attrs;
        my $src = Mojo::URL->new($attrs->{src});
        if (not $src->authority){
            my $nodeid = $src->query->param('nodeid');
            my $view = $src->query->param('view');

            $src->query(Mojo::Parameters->new);
            # first the scheme and then the authority (user:host:port)
            $src->scheme($pageUrl->scheme);
            $src->authority($pageUrl->authority);
            if ($src->path !~ m|^/|){
                $src->path($pageUrl->path.'/../'.$src->path);
            }
            my $url = $src->to_string;
            my $hash = $self->calcHash($url,$nodeid,$view);

            my $newSrc = Mojo::URL->new();
            $newSrc->path($self->root);
            $newSrc->query(
                hash => $hash,
                nodeid => $nodeid,
                view => $view,
                url => $url
            );
            if ($self->hostauth){
                $newSrc->query({hostauth=>$self->hostauth});
            }        
            $self->log->debug('img[src] in '.$attrs->{src});
            $attrs->{src} = $newSrc->to_string;
            $self->log->debug('img[src] out '.$attrs->{src});
            $changed = 1;
        }
    });
    $res->body($dom->to_xml) if $changed;
}

=head2 calcHash(ref)

Returns a hash for authenticating access to the ref

=cut

sub calcHash {
    my $self = shift;
    my $hash = hmac_md5_sum(@_,$self->secret);
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
