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

my $instance = 0;

has 'hostauth';
has 'scheme' => 'http';
has 'view' => 'default-rrd-html';
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
    for (qw(torrus.nodeid torrus.server torrus.tree torrus.url-prefix)){
        return undef unless defined $rec->{$_};
    };
    my $host = $rec->{'torrus.server'};
    my $path = '/'.$rec->{'torrus.url-prefix'} . '/'. 'main';
    $path =~ s{/+}{}g;
    my $nodeid = $rec->{'torrus.nodeid'};
    my $view = $self->view;

    my $url = $self->root.'/'.$self->calcHash($host,$path,$nodeid,$view).'/'.$host.$path
              . '?nodeid='.$nodeid.'&view='.$view;
    return {
        visualizer =>  'iframe',
        arguments => {
            src => $url
        }
    };
}

=head2 addProxyRoute()

create a proxy route with the given properties of the object

=cut

sub addProxyRoute {
    my $self = shift;
    my $routes = $self->routes;

    $routes->get($self->root.'/(:px_hash)/(:px_host)/(*px_path)' => sub {
        my $ctrl = shift;
        my $hash =  $ctrl->stash('px_hash');
        my $host =  $ctrl->stash('px_host');
        my $path =  $ctrl->stash('px_path');
        my $nodeid = $ctrl->req->params('nodeid');
        my $view = $ctrl->req->params('view');
        if ($hash ne $self->calcHash($host,$path,$nodeid,$view)){
            $ctrl->render(
                 status => 401,
                 text => "Supplied hash ($hash) does not match our expectations",
            );
            $self->log->warn("Request for $hash/$host/$path denied (non-matching hash)");
            return;
        }
        my $url = Mojo::URL->new();
        $url->scheme($self->scheme);
        $url->host($host);
        $url->path($path);
        $url->query(nodeid=>$nodeid,view=>$view);
        if ($self->hostauth){
            $url->query({hostauth=>$self->hostauth});
        }
        $ctrl->render_later;
        $ctrl->ua->get($url => sub {
            my ($self, $tx) = @_;
            if (my $res=$tx->success) {
                if ($res->headers->content_type =~ m'text/html'i){
                    $self->signImgSrc($host,$res);
                }
                $ctrl->tx->res($res);
                $ctrl->rendered;
            }
            else {     
                my ($msg,$error) = $tx->error;
                $ctrl->tx->res->headers->add('X-Remote-Status',$error.': '.$msg);
                $ctrl->render(
                    status => 500,
                    text => 'Failed to fetch data from backend'
                );
            }
        });
    });
}

=head2 signImgSrc(target,res)

Sign all image urls pointing to our server.

=cut

sub signImgSrc {
    my $self = shift;
    my $host = shift;
    my $nodeid = shift;
    my $res = shift;    
    my $dom = $res->dom;
    my $root = $self->root;
    my $changed;
    $dom->find('img[src]')->each( sub {
        my $attrs = shift->attrs;
        my $src = Mojo::URL->new($attrs->{src});
        if ((not $src->host or $src->host eq $host) and $src->params('nodeid')){
            my $hash = $self->calcHash($host,$src->path,$nodeid,$src->params('view'));
            $attrs->{src} = $self->root.'/'.$hash.'/'.$host.$src->path. '?nodeid='.$nodeid.'&view='.$src->params('view');
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
    return hmac_md5_sum(join(':',@_),$self->secret);
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
