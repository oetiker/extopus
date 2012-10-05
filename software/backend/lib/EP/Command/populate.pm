package EP::Command::populate;

use Mojo::Base 'Mojolicious::Command';
use Mojo::IOLoop;
use Mojo::UserAgent;
use EP;

has description => "(re-)populate the node cache.\n";
has usage       => <<"EOF";
usage: $0 populate [user]

  $0 populate
  $0 populate 2893844

EOF

# "Objection.
#  In the absence of pants, defense's suspenders serve no purpose.
#  I'm going to allow them... for now."
sub run {     
  my $self = shift;
  local $ENV{MOJO_MODE} = 'development';
  local $ENV{MOJO_LOG_LEVEL} = 'debug';
  local $ENV{EXTOPUS_FORCE_REPOPULATION} = 1;
  my $ua = Mojo::UserAgent->new->ioloop(Mojo::IOLoop->singleton);
  $ua->app(EP->new);
  my $log = $ua->app->log;
  my $defaultUser = $ua->app->cfg->{GENERAL}{default_user};
  my $user =  $ARGV[1];
  if (not $defaultUser and not $user){
    $log->fatal("User name missing");   
    die $self->usage;
  }
  $ua->get('/setUser/'.$user) if not $defaultUser;
  $ua->get('/app');
}

1;

=head1 NAME

Mojolicious::Command::get - Get command

=head1 SYNOPSIS

  use Mojolicious::Command::get;

  my $get = Mojolicious::Command::get->new;
  $get->run(@ARGV);

=head1 DESCRIPTION

L<Mojolicious::Command::get> is a command interface to L<Mojo::UserAgent>.

=head1 ATTRIBUTES

L<Mojolicious::Command::get> performs requests to remote hosts or local
applications.

=head2 C<description>

  my $description = $get->description;
  $get            = $get->description('Foo!');

Short description of this command, used for the command list.

=head2 C<usage>

  my $usage = $get->usage;
  $get      = $get->usage('Foo!');

Usage information for this command, used for the help screen.

=head1 METHODS

L<Mojolicious::Command::get> inherits all methods from L<Mojolicious::Command>
and implements the following new ones.

=head2 C<run>

  $get->run(@ARGV);

Run this command.

=head1 SEE ALSO

L<Mojolicious>, L<Mojolicious::Guides>, L<http://mojolicio.us>.

=cut
