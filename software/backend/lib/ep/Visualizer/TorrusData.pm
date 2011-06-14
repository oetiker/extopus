package ep::Visualizer::TorrusData;

=head1 NAME

ep::Visualizer::TorrusData - pull numeric data associated with torrus data source

=head1 SYNOPSIS

use ep::Visualizer::TorrusData;
my $viz = ep::Visualizer::TorrusData->new();

=head1 DESCRIPTION

Works in conjunction with the Data frontend visualizer. Data can be
presented in tabular form, as a csv download and as an Excel Worksheet.

This visualizer will match records that have the following attributes:

 torrus.url-prefix
 torrus.nodeid

The visualizer fetches data from torrus through the AGGREGATE_DS rpc call.

It determines further processing by evaluation additional configurable attributes

 *** VISUALIZER: data ***
 module = TorrusData
 selector = data_type
 type = PortTraffic
 name = Port Traffic
 sub_nodes = inbytes, outbytes
 col_names = Date, Avg In, Avg  Out, Total In, Total Out, Max In, Max Out, Coverage
 col_units =   , Mb/s, Mb/s, Gb, Gb, Mb/s, Mb/s, %
 col_widths = 2, 1     1,    1,  1,  1,    1,    1
 col_data = $D{inbytes}{AVG}, $D{inbytes}{AVG}, \
            $D{inbytes}{AVG} * $DURATION / 100 * $D{inbytes}{AVAIL}, \
            $D{outbytes}{AVG} * $DURATION / 100 * $D{outbytes}{AVAIL}, \
            $D{inbytes}{MAX}, \
            $D{outbytes}{MAX}

=cut

use strict;
use warnings;

use Mojo::Base 'ep::Visualizer::base';
use Mojo::Util qw(hmac_md5_sum url_unescape);
use Mojo::URL;
use Mojo::JSON::Any;
use Mojo::UserAgent;
use Mojo::Template;

use Time::Local qw(timelocal_nocheck);

use Spreadsheet::WriteExcel;
use Excel::Writer::XLSX;

use ep::Exception qw(mkerror);
use POSIX qw(strftime);

has 'hostauth';
has 'root';

has view => 'embedded';
has json => sub {Mojo::JSON::Any->new};

sub new {
    my $self = shift->SUPER::new(@_);
    $self->root('/torrusCSV_'.$self->instance);
    # parse some config data
    my @split_nodes = qw(col_names col_units col_widths sub_nodes);
    for my $prop (qw(selector name type col_data), @split_nodes){
        die mkerror(9273, "mandatory property $prop for visualizer module TorrusData is not defined")
            if not defined $self->cfg->{$prop};
    }
    for (@split_nodes){
        $self->cfg->{$_} = $self->cfg->{$_} ? [ split /\s*,\s*/, $self->cfg->{$_} ] : undef;
    }
    my $sub = eval 'sub { my $DURATION = shift; my %D = (%{$_[0]}); return [ '.$self->cfg->{col_data} . ' ] }';
    if ($@){
        die mkerror(38734,"Failed to compile $self->cfg->{col_data}"); 
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
    return [
        map { defined $nan <=> $_ ? $_ : undef } @$in
    ]    
}

=head2 matchRecord(rec)

can we handle this type of record

=cut

sub matchRecord {
    my $self = shift;
    my $rec = shift;
    for (qw(torrus.nodeid torrus.tree-url)){
        return undef unless defined $rec->{$_};
    }

    return undef 
        if $rec->{$self->cfg->{selector}} ne $self->cfg->{type};
    my $src = Mojo::URL->new();
    my $hash = $self->calcHash( $rec->{'torrus.tree-url'}, $rec->{'torrus.nodeid'});
    $src->path($self->root);    
    $src->query(
        hash => $hash,
        nodeid => $rec->{'torrus.nodeid'},
        url => $rec->{'torrus.tree-url'}
    );
    $src->base->path($self->root);
    my $plain_src = $src->to_rel;
    url_unescape $plain_src;
    return {
        visualizer => 'data',
        title => $self->cfg->{name},
        arguments => {
            instance => $self->instance,
            columns => $self->cfg->{col_names},
            column_widths => $self->cfg->{col_widths},
            column_units => $self->cfg->{col_units},
            intervals => [
                { key => 'day', name => 'Daily' },
                { key => 'week', name => 'Weekly' },
                { key => 'month', name => 'Monthly' },
                { key => 'year', name => 'Yearly' },
            ],
            treeUrl => $rec->{'torrus.tree-url'},
            nodeId => $rec->{'torrus.nodeid'},
            hash => $hash,
            csvUrl => $plain_src
        }
    };
}

=head2 getData(tree_url,nodeid,end,interval,count)

use the AGGREGATE_DS rpc call to pull some statistics from the server.

=cut

sub getData {
    my $self = shift;
    my $treeUrl = shift;
    my $nodeId = shift;
    my $end = shift;
    my $interval = shift;
    my $count = shift;
    my $url = Mojo::URL->new($treeUrl);
    my @return;
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
                @S{qw{sec min hour mday mon year wday yday isdst}} = localtime($end - 15 - $step * 365.25*24*3600/12);
                my $midMonStart = timelocal_nocheck(0,0,0,15,$S{mon},$S{year});
                @S{qw{sec min hour mday mon year wday yday isdst}} = localtime($midMonStart);
                @E{qw{sec min hour mday mon year wday yday isdst}} = localtime($midMonStart+365.25*24*3600/12);
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
            $self->log->debug("getting ".$url->to_string);
            my $tx = Mojo::UserAgent->new->get($url);
            my $data;
            if (my $res=$tx->success) {
                if ($res->headers->content_type =~ m'application/json'i){
                    my $ret = $self->json->decode($res->body);
                    if ($ret->{success}){
                        my $key = (keys %{$ret->{data}})[0];
                        $data{$subNode} = rrd2float($ret->{data}{$key});
                    } else {
                        $self->log->error("Fetching ".$url->to_string." returns ".$data->{error});
                        return {
                           status => 0,
                           error => $data->{error}
                        };
                    }
                }
                else {
                    $self->log->error("Fetching ".$url->to_string." returns ".$res->headers->content_type);
                    return {
                       status => 0,
                       error => "unexpected content/type (".$res->headers->content_type."): ".$res->body
                    };
                }
            }
            else {
                my ($msg,$error) = $tx->error;
                $self->log->error("Fetching ".$url->to_string." returns $msg ".($error ||''));
                return {    
                    status => 0,    
                    error => "fetching data for $nodeId from torrus server: $msg ".($error ||'')
                };
            }
        };
        my $row = denan($self->cfg->{col_data}($stepEnd - $stepStart,\%data));       
        push @return, [ $stepLabel, @{$row} ];
    }

    return {
        status => 1,
        data => \@return,
    };
}

=head2 rpcService 

provide rpc data access

=cut

sub rpcService {
    my $self = shift;
    my $arg = shift;
    die mkerror(9844,"hash is not matching url and nodeid")
        unless $self->calcHash($arg->{treeUrl},$arg->{nodeId}) eq $arg->{hash};
    return $self->getData($arg->{treeUrl},$arg->{nodeId},$arg->{endDate},$arg->{interval},$arg->{count});
}

=head2 addProxyRoute()

create a proxy route with the given properties of the object

=cut

sub addProxyRoute {
    my $self = shift;
    my $routes = $self->routes;
    $routes->get($self->prefix.$self->root, sub {
        my $ctrl = shift;
        my $req = $ctrl->req;
        my $hash =  $req->param('hash');
        my $nodeid = $req->param('nodeid');
        my $url = $req->param('url');
        my $end = $req->param('end');
        my $interval = $req->param('interval');
        my $count = $req->param('count');
        my $format = $req->param('format');
        my $newHash = $self->calcHash($url,$nodeid);
        if ($hash ne $newHash){
            $ctrl->render(
                 status => 401,
                 text => "Supplied hash ($hash) does not match our expectations",
            );
            $self->log->warn("Request for $url?nodeid=$nodeid denied ($hash ne $newHash)");
            return;
        }
        my $data = $self->getData($url,$nodeid,$end,$interval,$count);
        if (not $data->{status}){
            $ctrl->render(
                 status => 401,
                 text => $data->{error},
            );
            $self->log->error("faild getting data $data->{error}");
            return;
        }       
        my $rp = Mojo::Message::Response->new;
        $rp->code(200);
        my $name = $nodeid;
        $name =~ s/[^-_0-9a-z]+/_/ig;
        $name .= '-'.strftime('%Y-%m-%d',localtime($end));               
        my $fileData;
        $format = 'xlsx'; # debugging
        for ($format) {
            /csv/ && do {
                $fileData = $self->csvBuilder($data,$name);
                next;
            };
            /xlsx/ && do {
                $fileData = $self->xlsxBuilder($data,$name);
                next;
            };
            /xls/ && do {
                $fileData = $self->xlsBuilder($data,$name);
                next;
            };
        }
        $rp->headers->content_type($fileData->{contentType});
        $rp->headers->add('Content-Disposition',$fileData->{contentDisposition});
        $rp->body($fileData->{body});   
        $ctrl->tx->res($rp);
        $ctrl->rendered;
    });
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
        'contentDisposition' => "attachement; filename=$name.csv"
   };
   my @cnames;
   for (my $c=0;$self->cfg->{col_names}[$c];$c++){
        my $name = $self->cfg->{col_names}[$c];
        my $unit = $self->cfg->{col_units}[$c] || '';
        push @cnames, qq{"$name [$unit]"};
   }
   my $body = join(",",@cnames)."\r\n";
   for my $row (@{$data->{data}}){
       $body .= join(",",map { defined $_ && /[^.0-9]/ ? qq{"$_"} : ($_||'') } @$row)."\r\n";
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
   my $fileData = {
        'contentType'        => 'application/vnd.ms-excel',
        'contentDisposition' => "attachement; filename=$name.xls"
   };
   my @cnames;
   for (my $c=0;$self->cfg->{col_names}[$c];$c++){
	my $name = $self->cfg->{col_names}[$c];
        my $unit = $self->cfg->{col_units}[$c] || '';
	push @cnames, qq{"$name [$unit]"};
   }
   open my $fh, '>', \my $xlsbody or die "Failed to open filehandle: $!";
   my $workbook = Spreadsheet::WriteExcel->new($fh); 
   my $worksheet = $workbook->add_worksheet();  
   $worksheet->set_column('A:I',18);
   my $cnames_ref = \@cnames;
   my $header_format = $workbook->add_format();
   $header_format->set_bold();
   $worksheet->write_row(0, 0,$cnames_ref,$header_format);
   my $rowcounter = 1;
   for my $row (@{$data->{data}}){ 
       my @line = map { defined $_ && /[^.0-9]/ ? qq{$_} : ($_||'') } @$row;
       my $line_ref = \@line;
       $worksheet->write_row($rowcounter,0,$line_ref);
   }
   $workbook->close();   
   $fileData->{body} = $xlsbody;
   return $fileData;
}

=head2 xlsxBuilder(data,filename)

creates a xls data list

=cut

sub xlsxBuilder {
   my $self = shift;
   my $data = shift;
   my $name = shift;
   my $fileData = {
        'contentType'        =>  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'contentDisposition' => "attachement; filename=$name.xlsx"
   };
   my @cnames;
   for (my $c=0;$self->cfg->{col_names}[$c];$c++){
        my $name = $self->cfg->{col_names}[$c];   
	my $unit = $self->cfg->{col_units}[$c] || '';
	push @cnames, qq{"$name [$unit]"};
   }
   open my $fh, '>', \my $xlsxbody or die "Failed to open filehandle: $!";
   my $workbook = Excel::Writer::XLSX->new($fh);
   my $worksheet = $workbook->add_worksheet();
   $worksheet->set_column('A:I',18);
   my $cnames_ref = \@cnames;
   my $header_format = $workbook->add_format();
   $header_format->set_bold();
   $worksheet->write_row(0, 0,$cnames_ref,$header_format);
   my $rowcounter = 1;
   my $counter = 1; 
   for my $row (@{$data->{data}}){
       my @line = map { defined $_ && /[^.0-9]/ ? qq{$_} : ($_||'') } @$row;
       my $line_ref = \@line;
       $worksheet->write_row($rowcounter,0,$line_ref);
   }
   $workbook->close(); 
   $fileData->{body} = $xlsxbody;
   return $fileData;
}




=head2 calcHash(ref)

Returns a hash for authenticating access to the ref

=cut

sub calcHash {
    my $self = shift;
    $self->log->debug('HASH '.join(',',@_));    
    my $hash = hmac_md5_sum(join('::',@_),$self->secret);
    return $hash;
}

1;

__END__

=back

=head1 LICENSE

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
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
