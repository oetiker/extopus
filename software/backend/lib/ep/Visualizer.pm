package ep::Visualizer;

=head1 NAME

ep::Visualizer - visualizer management object

=head1 SYNOPSIS

 use ep::Visualizer;

 my $viz = ep::Visualizer->new(cfg,user,log,router,secret)
 my $matches = $viz->matchRecord(rec);
 
 # call $viz->visualizers->{'instance'}->XYZ

=head1 DESCRIPTION

The base class for inventory modules.

=cut

use Mojo::Base -base;

has 'cfg';
has 'visualizers' => sub { [] };
has 'vismap' => sub { {} };
has 'user';
has 'log';
has 'routes';
has 'secret';
has 'prefix';

=head2 new

create new inventory instance

=cut

sub new {
    my $self = shift->SUPER::new(@_);    
    my $cfg = $self->cfg;

    for my $entry ( sort { $cfg->{$a}{_order} <=> $cfg->{$b}{_order} } grep /^VISUALIZER:/, keys %{$self->cfg} ){
        my $drvCfg = $cfg->{$entry};
        require 'ep/Visualizer/'.$drvCfg->{module}.'.pm';
        $entry =~ m/VISUALIZER:\s*(\S+)/ or die "Could not match $entry";
        my $instance = $1;
        do {
            no strict 'refs';
            my $visObj = "ep::Visualizer::$drvCfg->{module}"->new({cfg=>$drvCfg,log=>$self->log,routes=>$self->routes,secret=>$self->secret,instance=>$instance,prefix=>$self->prefix});
            push @{$self->visualizers}, $visObj;
            $self->vismap->{$instance} = $visObj;
        }
    }
    return $self;
}

=head2 getVisualizers(record)

Find which visualizers consider themselves capable of visualizing this record.
See L<ep::Visualizer::base::matchRecord>.

=cut

sub getVisualizers {
    my $self = shift;
    my $record = shift;
    my $viz = $self->visualizers;
    my @matches;
    for my $instance (@$viz){
        push @matches, grep({ defined $_ }  $instance->matchRecord($record));
    }
    return \@matches;
}

=head2 visualize(instance,args)

call the rpcService method of the selected instance.

=cut

sub visualize {
    my $self = shift;
    my $instance = shift;
    return $self->vismap->{$instance}->rpcService(@_);
}

1;
__END__

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

