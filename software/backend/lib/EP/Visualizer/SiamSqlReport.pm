package EP::Visualizer::SiamSqlReport;

=head1 NAME

EP::Visualizer::SiamSqlReport - run custom sql and show result in extopus

=head1 SYNOPSIS

 *** VISUALIZER: topx ***
 module = SiamSqlReport
 title = Report
 rec_match_pl = $R{viz_type} eq "SqlReportA"
 caption = $R{title}
 caption_live = $R{title}." ".strftime('%Y-%m-%d',localtime($C{date}-3600*24*$C{days})). \
                " - ".strftime('%Y-%m-%d',localtime($C{date}));
 siam_dbh = cablecom.topx.dbhandle
 siam_cfg=/etc/test-mdb-vpntunnel.siam.yaml
 reload_day = 1

 +FORM_PL
 [{
    key => 'counter',
    widget => 'counterSelect',
    label => 'Counter'
 },
 {
    key => 'nettype',
    widget => 'networkTypeSelect',
    label => 'Type'
 },
 {
    key => 'date',
    widget => 'date',
    label => 'End'
 },
 {
    key => 'days',
    widget => 'selectBox',
    cfg => {
        structure => [ 
            { title => '1 Day',  key => 1 }, 
            { title => '2 Days',  key => 2 * 24 * 3600 }, 
            { title => '1 Week',  key => 7 },  
            { title => '4 Weeks', key => 28 },  
         ]
     }
  }
 ]

 # PortId,Value,Unit

 +SQL_TX
 SELECT TOPX_PORTID, RATE, 'bits/s' FROM 
 ( SELECT TOPX_DAILY_PORT_TRAFFIC.NC_PORTID AS TOPX_PORTID, AVERAGE(DAILY_RATE_AVG) as RATE
     FROM TOPX_DAILY_PORT_TRAFFIC JOIN PORT ON PORT.NC_PORTID=TOPX_DAILY_PORT_TRAFFIC.NC_PORTID
     WHERE AGGR_DATE > TO_DATE(<%= strftime('%Y-%m-%d',localtime($C{date})) %>, 'YYYY-MM-DD')
      AND AGGR_DATE < TO_DATE(<%= strftime('%Y-%m-%d',localtime($C{date})-3600*24*$C{days}) %>, 'YYYY-MM-DD')
       AND COUNTER_ID = <%= $C{counter} %>
       AND PORT.PORT_NETWORKTYPEID = <%= $C{nettype} %>
  GROUP BY TOPX_DAILY_PORT_TRAFFIC.NC_PORTID
  ORDER BY RATE DESC
 )
 WHERE ROWNUM <= 10


=head1 DESCRIPTION

This simple module can run sql queries and return the data to the
extopus frontend.

This visualizer will match records that have the following attribute set:

 vizType = 'SiamSqlReport'

As well as:

 sql
 col_units
 col_widths

=head1 METHODS

all the methods from L<EP::Visualizer::base>. As well as these:               

=cut

use strict;
use warnings;

use Mojo::Base 'EP::Visualizer::base';
use SIAM;
use YAML;

use EP::Exception qw(mkerror);
use POSIX qw(strftime);

has 'dbh';
has 'sql';
has 'args' => sub {[]};
has 'siam';

sub new {
    my $self = shift->SUPER::new(@_);
    for my $prop (qw(siam_dbh siam_cfg FORM_PL SQL_TX rec_match_pl), keys %{$self->cfg}){
        die mkerror(9273, "mandatory property $prop for visualizer module SiamSqlRep is not defined")
            if not defined $self->cfg->{$prop};
    }
    my $sql = $self->cfg->{SQL_TX}{_text};
    my $args = $self->args;    

    while ($sql =~ s/<%=(.+?)%>/?/){
        my $sub = eval 'sub { my %C = (%{$_[0]});my %R = (%{$_[1]});'.${1}.'}';
        if ($@){
            $self->app->log->error("Failed to compile $1");
            $sub = sub { undef };            
        }
        push @$args, $sub;
    }    
    $self->sql($sql);
    my $siamCfg =  YAML::LoadFile($self->cfg->{siam_cfg});
    $siamCfg->{Logger} = $self->app->log;
    my $siam = SIAM->new($siamCfg);
    $siam->set_log_manager($self->app->log);    
    $siam->connect;
    $self->dbh($siam->computable($self->cfg->{siam_dbh}));
    $self->siam($siam);
    return $self;
}

=head2 matchRecord(type,rec)

can we handle this type of record

=cut

sub matchRecord {
    my $self = shift;
    my $type = shift;
    my $rec = shift;
    my $cfg = $self->cfg;
    return  unless $type eq 'single' and $cfg->{rec_match_pl}->($rec);
    my $form = $self->cfg->{FORM_PL}{_text}->($rec);
    # replace magic selectboxes ...  they will require sql queries to determine
    # content later on
    for my $item (@$form){
        given ($item->{widget}){
            when ('counterSelect'){
                $item->{widget} = 'selectBox';
                my $dbh = $self->dbh;
                my $data = $dbh->selectall_arrayref('SELECT COUNTER_TITLE as "title", COUNTER_ID as "key" from TOPX_COUNTER_INFO order by COUNTER_TITLE',{Slice => {}});
                if ($dbh->err){
                    die mkerror(9172, 'fetching counter types: '.$dbh->errstr);
                }                 
                $item->{cfg} = {
                    structure => $data,
                };   
            }
            when ('networkTypeSelect'){
                $item->{widget} = 'selectBox';
                my $dbh = $self->dbh;
                my $data = $dbh->selectall_arrayref('SELECT NETWORK_TYPE_NAME as "title", NETWORK_TYPE_ID as "key" from NETWORK_TYPE order by NETWORK_TYPE_NAME',{Slice => {}});
                if ($dbh->err){
                    die mkerror(9172, 'fetching network types: '.$dbh->errstr);
                }                 
                $item->{cfg} = {
                    structure => $data
                };   
            }
        }

    }
    return {
        visualizer => 'directdata',
        instance => $self->instance,
        title => $cfg->{title},
        caption => $self->caption($rec),
        arguments => {
            form => $form
        }
    };    
}

=head2 rpcService(arg) 

provide rpc data access

=cut

sub rpcService {
    my $self = shift;
    my $controller = shift;
    my $args = shift;
    my $form = $args->{form};
    my $rec =  $controller->cache->getNode($args->{recId});
    my $cfg = $self->cfg;
    my $dbh = $self->dbh;
    my $sth = $dbh->prepare($self->sql);
    # replace empty date keys with current time
    my $formCfg = $self->cfg->{FORM_PL}{_text}->($rec);
    for my $item (@$formCfg){
        if ($item->{widget} eq 'date' and not $form->{$item->{key}} ){
            $form->{$item->{key}} = time;
        }
    }
    if ($dbh->err){
        die mkerror(33527, 'preparing: '.$dbh->errstr);
    }
    my @args = map { $_->($form,$rec) } @{$self->args};
    $self->app->log->debug("execute: ".join(',',@args));
    $sth->execute(@args);
    if ($sth->err){
        die mkerror(75322, 'executing:'.$sth->errstr);
    }

    my $data = $sth->fetchall_arrayref();
    if ($sth->err){
        die mkerror(7527, "fetching: ".$sth->errstr);
    }
    my $unit = $data->[0][-1];

    for (@$data) {
        pop @$_;
    }

    return {
        unit => $unit,
        data => $data,
        reload => ($cfg->{reload_day} // 1)*24*3600,
        caption => $self->caption_live($rec,$form),
    }
}

1;

__END__

=back

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
S<Roman Plessl E<lt>roman.plessl@oetiker.chE<gt>>

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
