package EP::Visualizer;
use strict;
use warnings;

=head1 NAME

EP::Visualizer - visualizer management object

=head1 SYNOPSIS

 use EP::Visualizer;

 my $viz = EP::Visualizer->new($app)
 my $matches = $viz->matchRecord($rec);
 
 # call $viz->visualizers->{'instance'}->XYZ

=head1 DESCRIPTION

The base class for inventory modules.

=cut

use Mojo::Base -base;

has 'visualizers' => sub { [] };
has 'vismap' => sub { {} };

=head1 ATTRIBUTES

=head2 app

a pointer to the application object

=cut

has 'app';

=head1 METHODS

All the methods of L<Mojo::Base> plus:

=cut

=head2 new(app)

create new inventory instance

=cut

sub new {
    my $self = shift->SUPER::new(@_);    
    my $cfg = $self->app->cfg;

    for my $entry ( sort { $cfg->{$a}{_order} <=> $cfg->{$b}{_order} } grep { /^VISUALIZER:/ } keys %{$cfg} ){
        my $drvCfg = $cfg->{$entry};
        require 'EP/Visualizer/'.$drvCfg->{module}.'.pm'; ## no critic (RequireBarewordIncludes)
        $entry =~ m/VISUALIZER:\s*(\S+)/ or die "Could not match $entry";
        my $instance = $1;
        do {
            no strict 'refs'; ## no critic (ProhibitNoStrict)
            my $visObj = "EP::Visualizer::$drvCfg->{module}"->new({app=>$self->app,cfg=>$drvCfg,instance=>$instance});
            push @{$self->visualizers}, $visObj;
            $self->vismap->{$instance} = $visObj;
        }
    }
    return $self;
}

=head2 getVisualizers(type,args)

Find which visualizers consider themselves capable of visualizing this record.
See L<EP::Visualizer::base::matchRecord>.

Curently the types B<single> and B<multi> are supported.
=cut

sub getVisualizers {
    my $self = shift;
    my $type = shift;
    my $args = shift;
    my $viz = $self->visualizers;
    my @matches;
    for my $instance (@$viz){
        push @matches, grep({ defined $_ }  $instance->matchRecord($type,$args));
    }
    return \@matches;
}

=head2 getMultiVisualizers(record)

Find which visualizers consider themselves capable of visualizing multiple records
similar to this one. See L<EP::Visualizer::base::matchMultiRecord>.

=cut

sub getMultiVisualizers {
    my $self = shift;
    my $record = shift;
    my $viz = $self->visualizers;
    my @matches;
    for my $instance (@$viz){       
        push @matches, grep({ defined $_ }  $instance->matchMultiRecord($record));
    }
    return \@matches;
}

=head2 visualize(instance,args)

call the rpcService method of the selected instance.

=cut

sub visualize {  ## no critic (RequireArgUnpacking)
    my $self = shift;
    my $instance = shift;
    my $obj = $self->vismap->{$instance};
    return $obj->rpcService(@_);
}

1;
__END__

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

 2011-04-20 to 1.0 first version

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

