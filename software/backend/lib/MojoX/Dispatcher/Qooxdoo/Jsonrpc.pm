package MojoX::Dispatcher::Qooxdoo::Jsonrpc;

use strict;
use warnings;

use Mojo::JSON;
use base 'Mojolicious::Controller';

our $VERSION = '0.53';

sub dispatch {
    my $self = shift;
    
    my ($package, $method, @params, $id, $cross_domain, $data, $reply, $error);
    
    my $debug = $self->stash('debug');

    # instantiate a JSON encoder - decoder object.
    my $json = Mojo::JSON->new;
    
    # We have to differentiate between POST and GET requests, because
    # the data is not sent in the same place..
    
    # non cross domain POST calls. 
    if ($self->req->method eq 'POST'){
        # Data comes as JSON object, so fetch a reference to it
        $data           = $json->decode($self->req->body);
        $id             = $data->{id};
        $cross_domain   = 0;
    }
    
    # cross-domain GET requests
    elsif ($self->req->method eq 'GET'){
        $data= $json->decode(
            $self->param('_ScriptTransport_data')
        );
        $id = $self->param('_ScriptTransport_id') ;
        $cross_domain   = 1;
    }
    else{
        print "wrong request method: ".$self->req->method."\n" if $debug;
        
        # I don't know any method to send a reply to qooxdoo if it doesn't 
        # send POST or GET 
        # return will simply generate a 
        # "Transport error 0: Unknown status code" in qooxdoo
        return;
    }
        
    if (not defined $id){
        $self->app->log->fatal("This is not a JsonRPC request.");
        return;
    }

    # Getting available services from stash
    my $services = $self->stash('services');

    # Check if desired service is available
    $package = $data->{service};


    if (not exists $services->{$package}){
        $reply = $json->
            encode({
                error => {
                    origin => 1, 
                    message => "Service $package not available", 
                    code=> '3'
                }, id => $id
            });
        _send_reply($reply, $id, $cross_domain, $self);
        return;
    }
    
    # Check if method is not private (marked with a leading underscore)
    $method = $data->{method};
    
    if ($method =~ /^_/){
        $reply = $json->
            encode({
                error => {
                    origin => 1, 
                    message => "private method ${package}::$method not accessible", 
                    code=> '2'
                }, id => $id
            });
        _send_reply($reply, $id, $cross_domain, $self);
        return;
    }
    
    # Check if method only consists of letters and underscore (not leading!)
    if ($method !~ /^[a-zA-Z_]+$/){
        $reply = $json->
            encode({
                error => {
                    origin => 1, 
                    message => "methods should only contain a-z, A-Z and _, $method is forbidden", 
                    code=> '1'
                }, id => $id
            });
        _send_reply($reply, $id, $cross_domain, $self);
        return;
    }
    
    
    @params  = @{$data->{params}}; # is a reference, so "unpack" it
    
    
    # invocation of method in class according to request 
    eval{
        # make sure there are not foreign signal handlers
        # messing with our problems
        local $SIG{__DIE__};
        local $SIG{__WARN__};
        if ($services->{$package}->can('_mojo_session')){
            # initialize session if it does not exists yet
            my $session = $self->stash->{'mojo.session'} ||= {};
            $services->{$package}->_mojo_session($session);
        }
        if ($services->{$package}->can('_mojo_stash')){
            # initialize session if it does not exists yet
            $services->{$package}->_mojo_stash($self->stash);
        }
        if ($services->{$package}->can('_check_access')){
            if ( not $services->{$package}->_check_access($method) ){
	        die { 
                 origin => 1, 
	            message => "Permission denied. Access to method $method is denied.",
                    code=> 1
                }
            }
        }
        no strict 'refs';
        $reply = $services->{$package}->$method(@params);
    };
    
    
    if ($@){ 
        for (ref $@){
            /HASH/ && do {
                $reply = $json->
                    encode({
                        error => {
                            origin => 2, 
                            message => $@->{message}, 
                            code=>$@->{code}
                        }, id => $id
                    });
                last;
            };
            /.+/ && do {
                $reply = $json->
                    encode({
                        error => {
                            origin => 2, 
                            message => $@->message(), 
                            code=>$@->code()
                        }, id => $id
                    });
                last;
            };
            $reply = $json->encode({
                error => {
                    origin => 2, 
                    message => "error while processing ${package}::$method: $@", 
                    code=> '9999'
                }, id => $id
            });
        }
    }
    # no error occurred
    else{
        $reply = $json->encode({id => $id, result => $reply});
    }
    
    _send_reply($reply, $id, $cross_domain, $self);
}

sub _send_reply{
    my ($reply, $id, $cross_domain, $self) = @_;
    
    if ($cross_domain){
        # for GET requests, qooxdoo expects us to send a javascript method
        # and to wrap our json a litte bit more
        $self->res->headers->content_type('application/javascript');
        $reply = 
            "qx.io.remote.transport.Script._requestFinished( $id, " . $reply . ");";
    }
    
    $self->render(text => $reply);
}

1;



=head1 NAME

MojoX::Dispatcher::Qooxdoo::Jsonrpc - Dispatcher for Qooxdoo Json Rpc Calls

=head1 SYNOPSIS

 # lib/your-application.pm

 use base 'Mojolicious';
 
 use RpcService;

 sub startup {
    my $self = shift;
    
    # instantiate all services
    my $services= {
        Test => RpcService->new(),
        
    };
    
    
    # add a route to the Qooxdoo dispatcher and route to it
    my $r = $self->routes;
    $r->route('/qooxdoo') -> to(
                'Jsonrpc#dispatch', 
                services    => $services, 
                debug       => 0,
                namespace   => 'MojoX::Dispatcher::Qooxdoo'
            );
        
 }

    

=head1 DESCRIPTION

L<MojoX::Dispatcher::Qooxdoo::Jsonrpc> dispatches incoming
rpc requests from a qooxdoo application to your services and renders
a (hopefully) valid json reply.


=head1 EXAMPLE 

This example exposes a service named "Test" in a folder "RpcService".
The Mojo application is named "qooxdooserver". The scripts are in
the 'example' directory.
First create this application using 
"mojolicious generate app qooxdooserver".

Then, lets write the service:

Change to the root directory "qooxdooserver" of your fresh 
Mojo-Application and make a dir named 'qooxdoo-services' 
for the services you want to expose.

Our "Test"-service could look like:

 package RpcService;

 use base qw(Mojo::Base);

 # if this attribute is created it will hold the mojo cookie session hash
 __PACKAGE__->attr('_mojo_session');
 # if this attribute exists it will provide access to the stash
 __PACKAGE__->attr('_mojo_stash');
 
 # optional access_check method the method is called right before the actual
 # method is called but after the _mojo_session and _mojo_stash properties
 # are assigned

 sub _check_access {
    my $self = shift;
    my $method = shift;          
    # check if we can access
    return 1; # if ok
 }

 sub add{
    my $self = shift;
    my @params = @_;
    
    # Debug message on Mojo-server console (or log)
    print "Debug: $params[0] + $params[1]\n";
    
    # uncomment if you want to die without further handling
    # die;
    
    # uncomment if you want to die with a message in a hash
    # die {code => 20, message => "Test died on purpose :-)"};
    
    
    # uncomment if you want to die with your homemade error object 
    # (simple example see below)
    # better use your elaborate error handling instead!
    
    # use Error;
    # my $error = new Error('stupid error message', '56457');
    # die $error;
    
    my $result =  $params[0] + $params[1]
    return $result;
    
 }

 1;
 
 
 # Example of simple and stupid Error class:
 
 package Error;

 sub new{
    my $class = shift;
    
    my $error = {
        message => shift;
        code    => shift;
    };
    
    bless $error, $class;
    return $error;
 }

 sub message{
    my $self = shift;
    return $self->{message};
 }

 sub code{
    my $self = shift;
    return $self->{code};
 }

1;

Please create a constructor (like "new" here) which instantiates
an object because we are going to use this in
our 'lib/qooxdooserver.pm' below.

Notice the exception handling: You can die without or with a message 
(see example above). 
MojoX::Dispatcher::Qooxdoo::Jsonrpc will catch the "die" like an 
exception an send a message to the client.
Happy dying! :-)


Now, lets write our application.
Almost everything should have been prepared by Mojo when you invoked 
"mojolicious generate app qooxdooserver" (see above).

Change to "lib/" and open "qooxdooserver.pm" in your favourite editor.
Then add some lines to make it look like this:

 package qooxdooserver;

 use strict;
 use warnings;
 
 use RpcService::Test;

 use base 'Mojolicious';

 # This method will run once at server start
 sub startup {
    my $self = shift;
    
    my $services= {
        Test => new RpcService::Test(),
        # more services here
    };
    
    # tell Mojo about your services:
    my $r = $self->routes;
    
    # this sends all requests for "/qooxdoo" in your Mojo server 
    # to our little dispatcher.
    # change this at your own taste.
    $r->route('/qooxdoo')->to('
        jsonrpc#handle_request', 
        services    => $services, 
        debug       => 0,
        namespace   => 'MojoX::Dispatcher::Qooxdoo'
    );
    
 }

 1;

Now start your Mojo Server by issuing 'script/qooxdooserver daemon'. 
If you want to change any options, type 'script/qooxdooserver help'. 

=head2 Security
MojoX::Dispatcher::Qooxdoo::Jsonrpc only allows methods matching
this pattern: /^[a-zA-Z_]+$/
This means you are allowed to use letters and the underscore.
Be aware that methods starting with an underscore are private by
convention and not exposed.

Only services explicitly loaded in lib/your-application.pm
will be accessible.


=head1 AUTHOR

Matthias Bloch, <lt>matthias at puffin ch<gt>
This Module is sponsored by OETIKER+PARTNER AG

=head1 COPYRIGHT AND LICENSE

Copyright (C) 2010 by :m)

This library is free software; you can redistribute it and/or modify
it under the same terms as Perl itself, either Perl version 5.8.8 or,
at your option, any later version of Perl 5 you may have available.




=cut
