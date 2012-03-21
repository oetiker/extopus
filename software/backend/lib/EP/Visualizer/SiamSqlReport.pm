package EP::Visualizer::SiamSqlReport;

=head1 NAME

EP::Visualizer::SiamSqlReport - run custom sql and show result in extopus

=head1 SYNOPSIS

 *** VISUALIZER: topx ***
 module = SiamSqlReport
 title = Report
 rec_match_pl = $R{viz_type} eq "SqlReportA"
 caption = $R{title}
 siam_dbh = cablecom.topx.dbhandle
 siam_cfg=/etc/test-mdb-vpntunnel.siam.yaml
 siammap_pl = $R{'torrus.port.shortname'}


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

    while ($sql =~ s/<%=(.+?)%>/%/){
        my $sub = eval 'sub { my %C = (%{$_[0]});'.${1}.'}';
        if ($@){
            die mkerror(38402, "Failed to compile $1");
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
    return  unless $type eq 'single';
    my $rec = shift;
    my $cfg = $self->cfg;
    my $form = $self->cfg->{FORM_PL}{_text}->($rec);
    # replace magic selectboxes ...  they will require sql queries to determine
    # content later on
    for my $item (@$form){
        given ($item->{widget}){
            when ('counterSelect'){
                $item->{wiget} = 'selectBox';
                $item->{cfg} = {
                    structure => [ 
                        { title => 'InBit',   key => 1 },
                        { title => 'OutBit',  key => 2 },
                    ]
                };   
            }
            when ('networkTypeSelect'){
                $item->{wiget} = 'selectBox';
                $item->{cfg} = {
                    structure => [ 
                        { title => 'Fast',   key => 68 },
                        { title => 'Slow',   key => 15 },
                    ]
                };   
            }
        }

    }
    return {
        visualizer => 'directdata',
        instance => $self->instance,
        title => $cfg->{title},
        caption => $cfg->{caption}($rec),
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
    my $arg = shift;
    my $cfg = $self->cfg;
    my $sth = $self->dbh->prepare($self->sql);
    $sth->execute(map { $_->($arg) } @{$self->args});

    my $data = $sth->fetchall_arrayref();
    if ($sth->err){
        die mkerror(7527, "fetching ".$self->sql.": ".$sth->errstr);
    }

    if ($cfg->{siammap_pl}){
        for (@$data) {
            my $obj = $self-siam->instantiate_object('SIAM::ServiceDataElement', "SIAM::ServiceUnit//$_[0]");
            $_[0] = $cfg->{port_pl}->($obj->attributes);
        }
    } 
    return $data;
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
