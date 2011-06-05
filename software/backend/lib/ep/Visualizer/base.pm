package ep::Visualizer::base;

=head1 NAME

ep::Visualizer::base - visualizer base class

=head1 SYNOPSIS

 use Mojo::Base 'eq::Visualizer::base';

=head1 DESCRIPTION

The base class for extopus visualizers

=cut

use Mojo::Base -base;

has 'cfg';
has 'log';
has 'routes';
has 'prefix' => '';
has 'secret';
has 'instance';

=head2 matchRecord(rec)

Given a database record (hash) this method decides if it is capable of
visualizing this information and if so, what visualization widget should be
used on extopus side. It returns either undef (no match) or a map:

 { visualizer: '...',
   properties: { }
 }

=cut

sub matchRecord {
    my $self= shift;
    my $rec = shift;    
    return undef;
}

=head2 rpcService

accessible via the C<visualize(visualizerInstance,args)> rpc call

=cut

sub rpcService {
    my $self = shift;
    my @args = @_;
    die "sorry, no rpc service support";   
}

1;
__END__

=head1 COPYRIGHT

Copyright (c) 2011 by OETIKER+PARTNER AG. All rights reserved.

=head1 AUTHOR

S<Tobias Oetiker E<lt>tobi@oetiker.chE<gt>>

=head1 HISTORY

 2011-05-16 to 1.0 first version

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

