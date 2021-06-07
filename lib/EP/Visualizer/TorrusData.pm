package EP::Visualizer::TorrusData;

=head1 NAME

EP::Visualizer::TorrusData - pull numeric data associated with torrus data source

=head1 SYNOPSIS

 *** VISUALIZER: data ***
 module = TorrusData
 selector = data_type
 type = PortTraffic
 title = Traffic Data
 caption = "$R{prod} $R{inv_id} $R{device_name}:$R{port}"
 caption_live = "Traffic Analysis $R{device_name}:$R{port}"
 skiprec_pl = $R{display} eq 'data_unavailable'
 savename_pl = $R{cust}.'_'.$R{inv_id}

 sub_nodes = inbytes, outbytes
 col_names = Date, Avg In, Avg  Out, Total In, Total Out, Max In, Max Out, Coverage
 col_units =   , Mb/s, Mb/s, Gb, Gb, Mb/s, Mb/s, %
 col_widths = 3,  3  ,    3,    3,  3,  3,    3, 2
 col_data = $D{range},int($D{inbytes}{AVG}*8/1e4)/1e2, \
           int($D{outbytes}{AVG}*8/1e4)/1e2, \
           int($D{inbytes}{AVG}*8 * $DURATION / 100 * $D{inbytes}{AVAIL}/1e7)/1e2, \
           int($D{outbytes}{AVG}*8 * $DURATION / 100 * $D{outbytes}{AVAIL}/1e7)/1e2, \
           int($D{inbytes}{MAX}*8/1e5)/1e1, \
           int($D{outbytes}{MAX}*8/1e5)/1e1, \
           int($D{inbytes}{AVAIL})

=head1 DESCRIPTION

Works in conjunction with the Data frontend visualizer. Data can be
presented in tabular form, as a csv download and as an Excel Worksheet.

This visualizer will match records that have the following attributes:

 torrus.tree-url
 torrus.nodeid

The visualizer fetches data from torrus through the AGGREGATE_DS rpc call.

It determines further processing by evaluation additional configurable attributes

=head1 METHODS

all the methods from L<EP::Visualizer::base>. As well as these:

=cut

use Mojo::Base 'EP::Visualizer::base';
use Mojo::Util qw(url_unescape);
use Mojo::URL;
use Mojo::JSON qw(decode_json);
use Mojo::UserAgent;
use Mojo::Template;

use Time::Local qw(timelocal_nocheck);

use Spreadsheet::WriteExcel;
use Excel::Writer::XLSX;

use EP::Exception qw(mkerror);
use POSIX qw(strftime);

has 'hostauth';

has root => sub {'torrusCSV_'.shift->instance };

has view => 'embedded';


sub new {
    my $self = shift->SUPER::new(@_);

    if( defined($self->cfg->{hostauth}) ){
        $self->hostauth($self->cfg->{hostauth});
    }
    # parse some config data
    my @split_nodes = qw(col_names col_units col_widths sub_nodes);
    for my $prop (qw(selector type col_data), @split_nodes){
        die mkerror(9273, "mandatory property $prop for visualizer module TorrusData is not defined")
            if not defined $self->cfg->{$prop};
    }
    for (@split_nodes){
        $self->cfg->{$_} = $self->cfg->{$_} ? [ split /\s*,\s*/, $self->cfg->{$_} ] : undef;
    }
    my $sub = eval 'sub { my $DURATION = shift; my $RANGE=shift; my %D = (%{$_[0]}); my %R = (%{$_[1]}); return [ '.$self->cfg->{col_data} . ' ] }'; ## no critic (ProhibitStringyEval)
    if ($@){
        die mkerror(38734,"Failed to compile ".$self->cfg->{col_data}.": $@");
    }
    $self->cfg->{col_data} = $sub;
    $self->addProxyRoute();
    return $self;
}


=head2 rrd2float(hash)

turn hash values that look liike floats into floats

=cut

sub rrd2float {
    my $hash = shift;
    my %out;
    my $nan = 0.0+"NaN";
    for my $key (keys %$hash){
        my $val =  $hash->{$key};
        if ( defined $val and $val ne ""){
            if ( $val =~ /[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/ ){
                $out{$key} = 1.0 * $val;
            }
            elsif ( $val =~ /nan/i ){
                # perl turns this into a real NaN it seems
                $out{$key} = $nan;
            }
            else {
                $out{$key} = $val;
            }
        }
        else {
            $out{$key} = undef;
        }
    }
    return \%out;
}

=head2 denan(array)

turn nan values into undef since json implementations have issues with nan ...

=cut

sub denan {
    my $in = shift;
    my $nan = 0.0+"NaN";
    no warnings; # don't get your undies in a twist when we look at a text bit
    return [
        map { defined $nan <=> $_ ? $_ : undef } @$in
    ]
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
    for (qw(torrus.nodeid torrus.tree-url)){
        return unless defined $rec->{$_};
    }

    if ($rec->{$cfg->{selector}} ne $cfg->{type}){
        return;
    }

    my $baseProps = {
        visualizer => 'data',
        instance => $self->instance,
        title => $cfg->{title},
        caption => $cfg->{caption}($rec),
        arguments => {}
    };

    if ($cfg->{skiprec_pl} and $cfg->{skiprec_pl}->($rec)){
        return $baseProps;
    };

    my $src = Mojo::URL->new();
    $src->path($self->root);

    return {
        %$baseProps,
        arguments => {
            columns => $cfg->{col_names},
            column_widths => $cfg->{col_widths},
            column_units => $cfg->{col_units},
            intervals => [
                { key => 'day', name => 'Daily' },
                { key => 'week', name => 'Weekly' },
                { key => 'month', name => 'Monthly' },
                { key => 'year', name => 'Yearly' },
            ],
            recId => $rec->{__epId},
            csvUrl => $src->to_string,
        }
    };
}

=head2 getData(controller,recId,end,interval,count)

use the AGGREGATE_DS rpc call to pull some statistics from the server.

=cut

sub getData {
    my $self = shift;
    my $controller  =shift;
    my $recId = shift;
    my $end = shift;
    my $interval = shift;
    my $count = shift;
    my @return;
    my $cache = EP::Cache->new(controller=>$controller,user=>($controller->app->cfg->{GENERAL}{default_user}|| $controller->session('epUser')));
    my $rec = $cache->getNode($recId);
    my $treeUrl = $rec->{'torrus.tree-url'};
    my $nodeId = $rec->{'torrus.nodeid'};
    if (not $treeUrl or not $nodeId){
        return {
            status => 0,
            error => "No data found for record $recId",
        }
    }
    my @stepLabels;
    my $url = Mojo::URL->new($treeUrl);
    for (my $step=0;$step < $count;$step++){
        my $stepStart;
        my $stepEnd;
        my $stepLabel;
        my %E;
        my %S;
        for ($interval){
            /day/ && do {
                @S{qw{sec min hour mday mon year wday yday isdst}} = localtime($end-$step*24*3600);
                $stepStart = timelocal_nocheck(0,0,0,$S{mday},@S{qw(mon year)});
                @E{qw{sec min hour mday mon year wday yday isdst}} = localtime($stepStart+25*3600);
                $stepEnd = timelocal_nocheck(0,0,0,$E{mday},@E{qw(mon year)});
                $stepLabel = strftime("%F",localtime($stepStart+12*3600));
                next;
            };
            /week/ && do {
                @S{qw{sec min hour mday mon year wday yday isdst}} = localtime($end-$step*7*24*3600);
                $stepStart = timelocal_nocheck(0,0,0,$S{mday} - $S{wday},@S{qw(mon year)});
                @E{qw{sec min hour mday mon year wday yday isdst}} = localtime($stepStart+7.1*24*3600);
                $stepEnd = timelocal_nocheck(0,0,0,$E{mday},@E{qw(mon year)});
                $stepLabel = strftime("%Y.%02V",localtime($stepStart+3.5*24*3600));
                next;
            };
            /month/ && do {
                @S{qw{sec min hour mday mon year wday yday isdst}} = localtime($end);
                my $midMonStart = timelocal_nocheck(0,0,0,15,$S{mon},$S{year});
                @S{qw{sec min hour mday mon year wday yday isdst}} = localtime($midMonStart - $step * 365.25*24*3600/12);
                @E{qw{sec min hour mday mon year wday yday isdst}} = localtime($midMonStart - ($step - 1)*365.25*24*3600/12);
                $stepStart = timelocal_nocheck(0,0,0,1,$S{mon},$S{year});
                $stepEnd = timelocal_nocheck(0,0,0,1,$E{mon},$E{year})-1;
                $stepLabel = strftime("%Y-%02m",localtime($stepStart));
                next;
            };
            /year/ && do {
                @E{qw{sec min hour mday mon year wday yday isdst}} = localtime($end);
                $stepStart = timelocal_nocheck(0,0,0,1,0,$E{year}-$step);
                $stepEnd = timelocal_nocheck(23,59,59,31,11,$E{year}-$step);
                $stepLabel = strftime("%Y",localtime($stepStart+180*24*3600));
                next;
            };
        }
        my %data;
        for my $subNode (@{$self->cfg->{sub_nodes}}){
            $url->query(
                view=> 'rpc',
                RPCCALL => 'AGGREGATE_DS',
                Gstart => $stepStart,
                Gend => $stepEnd,
                nodeid=>"$nodeId//$subNode"
            );
            if (defined($self->hostauth)){
                $url->query({hostauth=>$self->hostauth});
            }

            $self->app->log->debug("getting ".$url->to_string);
            my $res = Mojo::UserAgent->new->get($url)->result;
            my $data;
            if ($res->is_success) {
                if ($res->headers->content_type =~ m'application/json'i){
                    my $ret = $res->json;
                    if ($ret->{success}){
                        my $key = (keys %{$ret->{data}})[0];
                        $data{$subNode} = rrd2float($ret->{data}{$key});
                    } else {
                        $self->app->log->error("Fetching ".$url->to_string." returns ".$data->{error});
                        return {
                           status => 0,
                           error => $data->{error}
                        };
                    }
                }
                else {
                    $self->app->log->error("Fetching ".$url->to_string." returns ".$res->headers->content_type);
                    return {
                       status => 0,
                       error => "unexpected content/type (".$res->headers->content_type."): ".$res->body
                    };
                }
            }
            elsif ($res->is_error) {
                my $error = {message => $res->message};
                $self->app->log->error("Fetching ".$url->to_string." returns $error->{message}");
                return {
                    status => 0,
                    error => "fetching data for $nodeId from torrus server: $error->{message}"
                };
            }
        };
        my $row = denan($self->cfg->{col_data}($stepEnd - $stepStart,$stepLabel,\%data,$rec));
        push @stepLabels, $stepLabel;
        push @return, $row;
    }

    return {
        status => 1,
        stepLabels => \@stepLabels,
        data => \@return,
        caption => $self->caption_live($rec,{interval => $interval, endDate => $end })
    };
}


=head2 rpcService

provide rpc data access

=cut

sub rpcService {
    my $self = shift;
    my $controller = shift;
    my $arg = shift;
    return $self->getData($controller,$arg->{recId},$arg->{endDate},$arg->{interval},$arg->{count});
}

=head2 getWbName

determine title and file name for the export

=cut

sub getWbName {
    my $self = shift;
    my $cache = shift;
    my $recId = shift;
    my $data = shift;
    my $rec = $cache->getNode($recId);
    return $self->cfg->{savename_pl} ? $self->cfg->{savename_pl}($rec) : 'missing save name for $recId';
}


=head2 addProxyRoute()

create a proxy route with the given properties of the object

=cut

sub addProxyRoute {
    my $self = shift;
    my $routes = $self->app->routes;
    $routes->get($self->app->prefix.$self->root, sub {
        my $controller = shift;
        # make sure the rest of the object knows what we are doing here
        my $req = $controller->req;
        my $recId = $req->param('recid');
        my $end = $req->param('end');
        my $interval = $req->param('interval');
        my $count = $req->param('count') || 1;
        my $format = $req->param('format');
        my $data = $self->getData($controller,$recId,$end,$interval,$count);
        if (not $data->{status}){
            $controller->render(
                 status => 401,
                 text => $data->{error},
            );
            $self->app->log->error("failed getting data $data->{error}");
            return;
        }
        my $rp = Mojo::Message::Response->new;
        $rp->code(200);
        my $cache = EP::Cache->new(controller=>$controller,user=>($controller->app->cfg->{GENERAL}{default_user}|| $controller->session('epUser')));
        my $wbname = $self->getWbName($cache,$recId,$data);

        my $name = $wbname . ' - '.strftime('%Y-%m-%d',localtime($end));
        my $fileData;
        for ($format) {
            /csv/ && do {
                $fileData = $self->csvBuilder($data,$name);
                next;
            };
            /xlsx/ && do {
                $fileData = $self->xlsxBuilder($data,$name,$wbname);
                next;
            };
            /xls/ && do {
                $fileData = $self->xlsBuilder($data,$name,$wbname);
                next;
            };
        }
        $rp->headers->content_type($fileData->{contentType});
        # this should make the client comfortable caching this for a bit
        $rp->headers->last_modified(Mojo::Date->new(time-24*3600));
        $rp->headers->add('Content-Disposition',$fileData->{contentDisposition});
        $rp->body($fileData->{body});
        $controller->tx->res($rp);
        $controller->rendered;
    });
    return;
}

=head2 csvBuilder(data,filename)

creates a csv data list

=cut

sub csvBuilder {
   my $self = shift;
   my $data = shift;
   my $name = shift;
   my $fileData = {
        'contentType'        => 'application/csv',
        'contentDisposition' => "attachment; filename=$name.csv"
   };
   my @cnames = ('Range');
   for (my $c=0;$c < scalar @{$self->cfg->{col_names}};$c++){
        my $name = $self->cfg->{col_names}[$c];
        my $unit = $self->cfg->{col_units}[$c] || '';
        push @cnames, ( $unit ? qq{"$name [$unit]"} : $name );
   }
   my @extra;
   if ($data->{title}){
        @extra = ($data->{title});
   }
   my $body = join(";",@cnames)."\r\n";
   for my $row (@{$data->{data}}){
       $body .= join(";",map { defined $_ && /[^-e.0-9]/ ? qq{"$_"} : ($_||'') } @extra,@$row)."\r\n";
   }
   $fileData->{body} = $body;
   return $fileData;
}


=head2 xlsBuilder(data,filename)

creates a xls data list

=cut

sub xlsBuilder {
    my $self = shift;
    my $data = shift;
    my $name = shift;
    my $wbname = shift;
    my $fileData = {
        'contentType'        => 'application/vnd.ms-excel',
        'contentDisposition' => "attachment; filename=$name.xls"
    };
    my $xlsbody;
    my $xlsbody_ref = \$xlsbody;
    open my $fh, '>', $xlsbody_ref or die "Failed to open filehandle: $!";
    my $workbook = Spreadsheet::WriteExcel->new($fh);
    my $r = $self->_excelBuilder($data,$name,$wbname,$fileData,$xlsbody_ref,$workbook);
    close $fh;
    return $r;
}

=head2 xlsxBuilder(data,filename)

creates a xls data list

=cut

sub xlsxBuilder {
    my $self = shift;
    my $data = shift;
    my $name = shift;
    my $wbname = shift;
    my $fileData = {
       'contentType'        => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
       'contentDisposition' => "attachment; filename=$name.xlsx"
    };
    my $xlsxbody;
    my $xlsxbody_ref = \$xlsxbody;
    open my $fh, '>', $xlsxbody_ref or die "Failed to open filehandle: $!";
    my $workbook = Excel::Writer::XLSX->new($fh);
    my $r = $self->_excelBuilder($data,$name,$wbname,$fileData,$xlsxbody_ref,$workbook);
    close $fh;
    return $r
}

=head2 _excelBuilder(data,filename)

creates a excel data list (unified part for old and new excel format)

=cut

sub _excelBuilder {
    my $self      = shift;
    my $data      = shift;
    my $name      = shift;
    my $wbname    = shift;
    my $fileData      = shift;
    my $excelBody_ref = shift;
    my $workbook      = shift;
    my @cnames;
    for (my $c=0;$c < scalar @{$self->cfg->{col_names}};$c++){
        my $cname = $self->cfg->{col_names}[$c];
        my $unit = $self->cfg->{col_units}[$c] || '';
        push @cnames, ( $unit ? qq{"$cname [$unit]"} : $cname );
    }
    my $worksheet = $workbook->add_worksheet(substr($wbname,0,31));
    $worksheet->set_column('A:I',18);

    my $cnames_ref = \@cnames;
    my $header_format = $workbook->add_format();
    $header_format->set_bold();
    my $rowcounter = 0;
    if ($data->{title}){
        $worksheet->write_row($rowcounter++, 0,['Range',$data->{title}],$header_format);
    }
    $worksheet->write_row($rowcounter++, 0,$cnames_ref,$header_format);
    for my $row (@{$data->{data}}){
        my @line = map { defined $_ && /[^.0-9]/ ? qq{$_} : ($_||'') } @$row;
        my $line_ref = \@line;
        $worksheet->write_row($rowcounter++,0,$line_ref);
    }
    $workbook->close();
    $fileData->{body} = $$excelBody_ref; # deref
    return $fileData;
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
