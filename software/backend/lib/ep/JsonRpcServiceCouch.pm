package ep::JsonRpcService;
use strict;
use ep::Exception qw(mkerror);
use Mojo::Base -base;
use Mojo::UserAgent;
use Mojo::JSON;
use Mojo::URL;

=head1 NAME

ep::JsonRpcService - RPC services for ep

=head1 SYNOPSIS

This module gets instanciated by L<ep::MojoApp> and provides backend functionality for Extopus.

=head1 DESCRIPTION

All methods on this class can get called remotely as long as their name does not start with an underscore.

=head2 new()

Create a service object.

=cut 

our @tree = qw(town address floor vendor product release device);

sub new {
    my $self = shift->SUPER::new(@_);
    $self->{ua} = Mojo::UserAgent->new;
    return $self;
}

our %allow = (
    getTreeBranch => 1,
    getNodePropertyKeys => 1,
    getNodeCount => 1,
    getNodeList => 1
);

sub allow_rpc_access {
    my $self = shift;
    my $method = shift;
    return $allow{$method}; 
}
   
=head2 getTreeBranch({filter=>[v1,v2,...])

Get the next level of branches  given the first few are already set.

=cut  

sub getTreeBranch {
    my $self = shift;
    my $args = shift;
    my @filter = @{$args->{filter}};    
    my $level = scalar @filter;
    my @return;
    my $url = Mojo::URL->new('http://localhost:5984/extopus/_design/application/_view/tree');
    my $json = Mojo::JSON->new;    
    $url->query({
        $level ? (
            startkey => $json->encode(\@filter),
            endkey => $json->encode([@filter,{}]),
        ) : (),
        group => $json->encode($json->true),
        group_level => $json->encode($level+1)
    });
    my $data =  $self->{ua}->get($url->to_string)->res->json;
    return {list => [ map { $_->{key}[$level] } @{$data->{rows}} ], typ=> ($level < $#tree) ? 'branch' : 'leaf' };
}

=head2 getNodePropertyKeys()

Get the array of node property keys to display.

=cut  

sub getNodePropertyKeys {
    return ['port',@tree];
}

=head2 getNodeCount(filter)

Get the number of nodes matching filter.

=cut  

sub getNodeCount {
    my $self = shift;
    my $args = shift;    
    my $url = Mojo::URL->new('http://localhost:5984/extopus');
    #my $json = Mojo::JSON->new;
    #$url->query({});
    my $data =  $self->{ua}->get($url->to_string)->res->json;
    return $data->{doc_count};
}

=head2 getNodeList(lastRow=>?,firstRow=>?,filter)

Get the number of nodes matching filter.

=cut  

sub getNodeList {
    my $self = shift;
    my $args = shift;
    my $url = Mojo::URL->new('http://localhost:5984/extopus/_all_docs');
    my $json = Mojo::JSON->new;
    $url->query({
        include_docs=> $json->encode($json->true),
        limit =>  $args->{lastRow} - $args->{firstRow}+1,
        skip => $args->{firstRow}
    });
    my $data =  $self->{ua}->get($url->to_string)->res->json;
    return [map{$_->{doc}} @{$data->{rows}} ];    
}



1;
__END__
=head1 COPYRIGHT

Copyright (c) 2011 by OETIKER+PARTNER AG. All rights reserved.

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

=head1 AUTHOR

S<Tobias Oetiker E<lt>tobi@oetiker.chE<gt>>

=head1 HISTORY 

 2011-01-25 to Initial

=cut
  
1;

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
