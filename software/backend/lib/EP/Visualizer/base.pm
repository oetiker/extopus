package EP::Visualizer::base;
use strict;
use warnings;

=head1 NAME

EP::Visualizer::base - visualizer base class

=head1 SYNOPSIS

 use Mojo::Base 'eq::Visualizer::base';

=head1 DESCRIPTION

The base class for extopus visualizers

=head1 ATTRIBUTES

=cut

use Mojo::Base -base;
use Mojo::Util qw(hmac_sha1_sum url_unescape);

=head2 cfg

A hash pointer to the instance configuration.

=cut

has 'cfg';

=head2 app

a pointer to the application object

=cut

has 'app';

=head2 instance

the name of the instance

=cut

has 'instance';


=head1 METHODS

All the methods of L<Mojo::Base> as well as these:

=cut

=head2 matchRecord(rec)

Given a database record (hash) this method decides if it is capable of
visualizing this information and if so, what visualization widget should be
used on extopus side. It returns either undef (no match) or an array of maps:

 [
    { visualizer => '...',
      properties => { }
    },
    ...

 ]

=cut


sub matchRecord {
    my $self= shift;
    my $rec = shift;    
    return;
}

=head2 matchMultiRecord(rec)

Can the Visualizer deal with multiple records of the given type?

=cut

sub matchMultiRecord {
    my $self= shift;
    my $rec = shift;    
    return;
}

=head2 caption(record)

Returning the caption for the visualizer. This relies on the perl expression
provided in the caption property of the viaualizer configuration.

=cut

sub caption {
    my $self = shift;
    my $rec = shift;
    my $cap = eval { $self->cfg->{caption}->($rec) };
    if ($@){
        $cap = 'Caption Error: '.$@;
    }
    return $cap;
}

=head2 caption_live

The same as caption but it is called in the rcpService method to provide an
updated caption based on the record AND any additional properties the
rpcService wants to provide. The config option is called caption_live.

=cut

sub caption_live {
    my $self = shift;
    my $rec = shift;
    
    return $self->caption($rec) unless $self->cfg->{caption_live};

    my $conf = shift;
    my $cap = eval { $self->cfg->{caption_live}->($rec,$conf) };
    if ($@){
        $cap = 'Caption Error: '.$@;
    }
    return $cap;
}


=head2 rpcService($ctrl,@)

custom rpc service of this visualizer. accessible via the C<visualize(visualizerInstance,args)> rpc call

=cut

sub rpcService {  ## no critic (RequireArgUnpacking)
    my $self = shift;
    my $controller = shift;
    my @args = @_;
    die "sorry, no rpc service support";   
}

=head2 calcHash(ref)

Returns a hash for authenticating access to the ref

=cut

sub calcHash {   ## no critic (RequireArgUnpacking)
    my $self = shift;
    # $self->log->debug('HASH '.join(',',@_));    
    my $hash = hmac_sha1_sum(join('::',@_),$self->app->secrets->[0]);
    return $hash;
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

