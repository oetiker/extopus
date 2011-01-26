package ep::Exception;

=head1 NAME

ep::Exception - a simple exception class

=head1 SYNOPSIS

 use ep::Exception qw(error);

 eval { die error(22,'Bad Error'); }
 if ($@){
     print "Code: '.$@->code()." Message: ".$@->message()."\n"
     print "$@\n"; #stringified error
 }
 
=head1 DESCRIPTION

An error object to be used in remOcular code.

=over

=cut

use strict;
use warnings;

use Exporter 'import';
use vars qw(@EXPORT_OK);
@EXPORT_OK = qw(mkerror);

use overload ('""' => 'stringify');


use base qw(Mojo::Base);
__PACKAGE__->attr('code');
__PACKAGE__->attr('message');



=item B<mkerror>(I<code>,I<message>)

Create an nq::Exception object, setting code and message properties in the process.

=cut

sub mkerror {
    my $code = shift;
    my $message = shift;
    return (__PACKAGE__->new(code=>$code,message=>$message));
}

=item B<stringify>

error stringification handler

=cut

sub stringify {
    my $self = shift;
    return "ERROR ".$self->code().": ".$self->message();
}

1;
__END__

=back

=head1 COPYRIGHT

Copyright (c) 2010 by OETIKER+PARTNER AG. All rights reserved.

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

