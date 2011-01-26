package ep::JsonRpcService;
use strict;
use ep::Exception qw(mkerror);
use base qw(Mojo::Base);
use MongoDB;
use Tie::IxHash;

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
    my $conn = MongoDB::Connection->new;
    $self->{database} = $conn->get_database('extopus');
    $self->{nodes} = $self->{database}->get_collection('nodes');
    $self->{nodes}->ensure_index(Tie::IxHash->new( map { $_ => 1 } @tree));
    return $self;
}


=head2 getTreeBranch([v1,v2,...])

Get the next level of branches  given the first few are already set.

=cut  

sub getTreeBranch {
    my $self = shift;
    my $filter_values = shift;
    my @filter;
    my $level = 0;
    my @return;
    for (my $level=0;;$level++){
        my $key = $tree[$level] or die "Tree depth at $level";
        if ($filter_values->[$level]){
            my $val = $filter_values->[$level];
            push @filter, $key,$val;
        }
        else {
            my $list = $self->{database}->get_collection('tk_'.$key);
            my $q = $list->query({});    
            if ($q->count() < 1000){
                while (my $doc = $q->next){
                    my $val = $doc->{k};        
                    my $newfilt = {@filter,$key,$val};
                    if ($self->{nodes}->find_one($newfilt)){       
                        push @return, $val;
                    }
                }
            }
            else {
                my $q = $self->{nodes}->query({@filter})->fields({"$key"=>1});
                my %dedup;
                while (my $doc = $q->next){
                    my $val = $doc->{$key};
                    next if $dedup{$val};
                    $dedup{$val} = 1;
                    push @return, $val;
                }
            }
            return {list => [sort @return], typ=> ($level < $#tree) ? 'branch' : 'leaf' };
        }       
    }       
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

sub _makeFilter {
    my $self = shift;
    my $filter_values = shift;
    my %filter;
    for (my $level=0;;$level++){
        if ($filter_values->[$level]){
            my $key = $tree[$level] or die "Tree depth limited at $level";
            my $val = $filter_values->[$level];
            $filter{$key} =$val;
        } else {
            return \%filter;
        }
    }
}    


sub getNodeCount {
    my $self = shift;
    my $filter = $self->_makeFilter(shift);
    return $self->{nodes}->query($filter)->count();
}

=head2 getNodeCount(filter)

Get the number of nodes matching filter.

=cut  

sub getNodeList {
    my $self = shift;
    my $args = shift;
    my %queryAttr = (
        limit => $args->{lastRow} - $args->{firstRow}+1,
        skip => $args->{firstRow}
    );
    if ($args->{sortColumn}){
        $queryAttr{sort_by} = {
            "$args->{sortColumn}" => 1
        };
    }
    my $cursor = $self->{nodes}->query($self->_makeFilter($args->{filter}),\%queryAttr);
    my @data;
    while (my $node = $cursor->next){
        push @data, { map {$_ => $node->{$_} } @{$self->getNodePropertyKeys()} };        
    }
    return \@data;    
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
