package EP::Controller::OpenId;

use Mojo::Base 'Mojolicious::Controller', -signatures;
use Mojo::URL;
use Mojo::Util qw(dumper);

=head1 NAME

EP::Controller::OpenId - OpenID Controller

=head1 SYNOPSIS

 $routes->get('/openid/auth')->to(
    controller => 'OpenId',
    action => 'auth',
 );
 $routes->get('/openid/callback')->(
    controller => 'OpenId',
    action => 'cb',
 );

=head1 DESCRIPTION

Provide OpenID authentication for EP using the OpenID Connect protocol.

=head1 ATTRIBUTES

All attributes inherited from L<Mojo::Base>. As well as the following:

=cut

=head2 gcfg

Access the GENERAL configuraiton. See L<EP::Config> for details.especially the C<openid_*> attributes.

Examples:

 openid_url = http://keycloak.example.com
 openid_realm = extopus-realm
 openid_client_id = extopus-client
 openid_client_secret = 1234567890
 openid_callback = http://extopus.example.com/openid/callback
 openid_epuser_attribute = ep_user

=cut

has gcfg => sub ($self) { $self->app->cfg->{GENERAL} };

=head1 METHODS

All methods inherited from L<Mojo::Base> as well as the following:

=head2 loadConfig($app)

Load the OpenID configuration from the OpenID provider. This should be called
once at startup time.

=cut

my $openIdCfg;

sub loadConfig ($app) {
    return if $openIdCfg;
    my $ua = $app->ua;
    my $gcfg = $app->cfg->{GENERAL};
    my $cfgurl = Mojo::URL->new($gcfg->{openid_url}
        .'/realms/'.$gcfg->{openid_realm}
        .'/.well-known/openid-configuration');
    $app->log->debug("loading openid config from $cfgurl");
    my $cfg = $ua->get($cfgurl)->res;
    if (not $cfg->is_success) {
        $app->log->error($cfg->to_string);
        return;
    }
    # $self->log->debug($cfg->to_string);
    $openIdCfg = $cfg->json;
};

=head2 auth

Redirect the user to the OpenID provider for authentication.

=cut

sub auth ($self) {
    my $url = Mojo::URL->new($openIdCfg->{authorization_endpoint});
    $self->redirect_to(
        $url->query(
            client_id => $self->gcfg->{openid_client_id}, 
            response_type => 'code', 
            scope => 'openid', 
            redirect_uri => $self->gcfg->{openid_callback}
        )
    );
}

=head2 callback

Handle the callback from the OpenID provider. This will extract the user
information from the OpenID provider and store it in the session.

=cut

sub callback ($self) {
    my $ua = $self->app->ua;
    my $gcfg = $self->gcfg;
    my $auth = $ua->post($openIdCfg->{token_endpoint} => form => {
        code => $self->param('code'),
        client_id => $gcfg->{openid_client_id},
        client_secret => $gcfg->{openid_client_secret},
    	redirect_uri => $gcfg->{openid_callback},
    	grant_type => 'authorization_code'
    })->res;
    if (not $auth->is_success) {
        $self->log->error($auth->to_string);
        return $self->render(text => 'auth error', code => 403);
    }
    my $userInfo = $ua->get($openIdCfg->{userinfo_endpoint} => {
        authorization => 'Bearer '.$auth->json->{access_token}
    })->res;
    if (not $userInfo->is_success) {
        $self->log->error($userInfo->to_string);
        return $self->render(text => 'userinfo error', code => 403);
    }
    $self->log->debug(dumper $userInfo->json);
    my ($user,$login) = split /:/, ($userInfo->json->{$gcfg->{openid_epuser_attribute}} // '');
    if (not $user) {
        $self->log->error("no $gcfg->{openid_epuser_attribute} attribute found in userinfo (".dumper($userInfo->json).")");
        return $self->render(text => 'userinfo not found', code => 403);
    }
    $self->session->{epUser} = $user;
    $self->session->{epLogin} =$login;
    $self->redirect_to('/'.$self->app->prefix);
}

1;

=head1 COPYRIGHT

Copyright (c) 2023 by OETIKER+PARTNER AG. All rights reserved.

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

=head1 AUTHOR

S<Tobias Oetiker E<lt>tobi@oetiker.chE<gt>>

=head1 HISTORY

 2023-02-20 to 1.0 first version

=cut


