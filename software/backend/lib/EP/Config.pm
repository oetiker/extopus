package EP::Config;
use strict;  
use warnings;

=head1 NAME

EP::Config - The Extopus File

=head1 SYNOPSIS

 use EP::Config;

 my $parser = EP::Config->new(file=>'/etc/extopus/system.cfg');

 my $cfg = $parser->parse_config();
 my $pod = $parser->make_pod();

=head1 DESCRIPTION

Configuration reader for Extopus

=cut

use Carp;
use Config::Grammar;
use Mojo::Base -base;

has 'file';
    

=head1 METHODS

All methods inherited from L<Mojo::Base>. As well as the following:

=cut

=head2 $x->B<parse_config>(I<path_to_config_file>)

Read the configuration file and die if there is a problem.

=cut

sub parse_config {
    my $self = shift;
    my $cfg_file = shift;
    my $parser = $self->_make_parser();
    my $cfg = $parser->parse($self->file) or croak($parser->{err});
    return $cfg;
}

=head2 $x->B<make_config_pod>()

Create a pod documentation file based on the information from all config actions.

=cut

sub make_pod {
    my $self = shift;
    my $parser = $self->_make_parser();
    my $E = '=';
    my $footer = <<"FOOTER";

${E}head1 COPYRIGHT

Copyright (c) 2011 by OETIKER+PARTNER AG. All rights reserved.

${E}head1 LICENSE

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

${E}head1 AUTHOR

S<Tobias Oetiker E<lt>tobi\@oetiker.chE<gt>>

${E}head1 HISTORY

 2011-04-19 to 1.0 first version

FOOTER
    my $header = $self->_make_pod_header();    
    return $header.$parser->makepod().$footer;
}



=head2 $x->B<_make_pod_header>()

Returns the header of the cfg pod file.

=cut

sub _make_pod_header {
    my $self = shift;
    my $E = '=';
    return <<"HEADER";
${E}head1 NAME

extopus.cfg - The Extopus configuration file

${E}head1 SYNOPSIS

 *** GENERAL ***
 cache_dir = /scratch/extopus
 mojo_secret = Secret Cookie
 log_file = /tmp/dbtoria.log
 localguide = /home/doc/extopusguide.pod
 update_interval = 86400 
 # default_user = admin

 *** FRONTEND ***
 logo_large = http://www.upc-cablecom.biz/en/cablecom_logo_b2b.jpg
 logo_top = http://www.upc-cablecom.biz/en/cablecom_logo_b2b.jpg
 title = test title
 open_branches = 5
 tree_width =  10
 *** ATTRIBUTES ***
 prod = Product
 country = Country
 city = City
 street = Street
 number = No
 cust = Customer
 svc_type = Service
 data = Data
 data_type = Type
 port = Port
 inv_id = InvId


 *** TABLES ***
 search = prod, country, city, street, number, cust, svc_type, data, data_type, port, inv_id
 search_width = 1,   1,       1,    1,      1,    1,          1,   1
 tree = prod, country, city, street, number, cust, svc_type, data, data_type, port, inv_id
 tree_width = 1,   1,      1,    1,      1,    1,          1,    1 

 *** INVENTORY: dummy ***
 module=SIAM

 xycany_pl = \$R{cust} 
 +XYC_TX 
 some text
 +OTHER_PL
 "perl".\$R{cust}

 +MAP
 prod = siam.svc.product_name
 country =  xyc.svc.loc.country
 city = xyc.svc.loc.city
 street = \$R{'xyc.svc.loc.address'} . ' ' . \$R{'xyc.svc.loc.building_number'}
 cust = siam.contract.customer_name
 svc_type = siam.svc.type
 data = siam.svcdata.name
 data_type = siam.svcdata.type
 port = xyc.port.shortname
 inv_id = siam.svc.inventory_id
 torrus.tree-url = torrus.tree-url
 torrus.nodeid = torrus.nodeid
 
 +TREE
 'Location',\$R{country}, \$R{city}, \$R{street}
 \$R{cust},\$R{svc_type},\$R{data_type}

 *** VISUALIZER: xyc ***
 module = xyc
 title = Tab Title
 caption = \$R{cust}

 xycany_pl = \$R{cust}
 +XYC_TX
 some text
 +OTHER_PL
 "perl".\$R{cust}

${E}head1 DESCRIPTION

Extopus configuration is based on L<Config::Grammar>. The following options are available.

HEADER

}

=head2 $x->B<_make_parser>()

Create a config parser for DbToRia.

=cut

sub _make_parser {
    my $self = shift;
    my $E = '=';

    my $compileR = sub { 
        my $code = $_[0];
        # check and modify content in place
        my $perl;
        if ($code =~ /[{("';\[]/){
            $perl = 'sub { my %R = (%{$_[0]}); '.$code.'}';
        }
        else {
           $perl = 'sub { $_[0]->{"'.$code.'"}}';
        }
        my $sub = eval $perl; ## no critic (ProhibitStringyEval)
        if ($@){
            return "Failed to compile $code: $@ ";
        }
        $_[0] = $sub;
        return;
    };

    my $grammar = {
        _sections => [ qw{GENERAL FRONTEND /INVENTORY:\s+\S+/ /VISUALIZER:\s+\S+/ ATTRIBUTES TABLES }],
        _mandatory => [qw(GENERAL FRONTEND ATTRIBUTES TABLES)],
        GENERAL => {
            _doc => 'Global configuration settings for Extopus',
            _vars => [ qw(cache_dir mojo_secret log_file log_level default_user update_interval localguide) ],
            _mandatory => [ qw(cache_dir mojo_secret log_file) ],
            cache_dir => { _doc => 'directory to cache information gathered via the inventory plugins',
                _sub => sub {
                    if ( not -d $_[0] ){
                        system "/bin/mkdir","-p",$_[0];
                    }
                    -d $_[0] ? undef : "Cache directory $_[0] does not exist (and could not be created)";
                }
            },
            localguide => { _doc => 'path to a pod file describing the local setup' },
            default_user => { _doc => 'use this user for inventory authentication' },
            mojo_secret => { _doc => 'secret for signing mojo cookies' },
            log_file => { _doc => 'write a log file to this location (unless in development mode)'},
            log_level => { _doc => 'what to write to the logfile'},
            update_interval => { _doc => 'check for updates every x seconds. 1 day by default'},
        },
        FRONTEND => {
            _doc => 'Frontend tuneing parameters',
            _vars => [ qw(logo_large logo_top title open_branches tree_width) ],
            logo_large => { _doc => 'url for logo to show when no visualizers are selected' },
            logo_top => { _doc => 'url for logo to show in the top row of the screen' },
            title => { _doc => 'tite to show in the top right corner of the app' },
            open_branches => { _doc => 'how many branches to open initially in the tree', _re => '\d+', _re_error => 'use an integer for the number of open branches' },
            tree_width => { _doc => 'how wide is the tree in relationship to the content area ... default is 10 (content is 30)' , _re => '\d+', _re_error => 'use an integer for the width of the tree' },
        },
        ATTRIBUTES => {
            _vars => [ '/[-._a-z0-9]+/' ],
            '/[-_a-z0-9]+/' => {
                _doc => 'List of known attributes with friendly names.',
                _examples => 'city = City'
            },            
        },
        TABLES => {
            _vars => [ qw(search tree search_width tree_width) ],
            _mandatory => [ qw(search tree) ],
            search => {
                _doc => 'list of attributes for search results table',
                _examples => 'search = prod, country, city, street, number',
                _sub => sub { $_[0] = [ split /\s*,\s*/, $_[0] ]; undef },
            },            
            search_width => {
                _doc => 'list of relative column widths',
                _examples => 'search_width = 3,1,1,1,1',
                _sub => sub { $_[0] = [ split /\s*,\s*/, $_[0] ]; undef },
            },            
            tree => {
                _doc => 'list of attributes for tree nodes table',
                _examples => 'tree = prod, country, city, street, number',
                _sub => sub { $_[0] = [ split /\s*,\s*/, $_[0] ]; undef },
            },            
            tree_width => {
                _doc => 'list of relative column widths',
                _examples => 'tree_width = 3,1,1,1,1',
                _sub => sub { $_[0] = [ split /\s*,\s*/, $_[0] ]; undef },
            },            
        },

        '/INVENTORY:\s+\S+/' => {
            _order => 1,
            _doc => 'Instanciate an inventory object',
            _vars => [ qw(module /[-._a-z]+_pl/ /[-._a-z]+/) ],
            _mandatory => [ 'module' ],
            module => {
                _doc => 'The inventory module to load'
            },
            _sections => [ qw(TREE MAP /[-._A-Z]+_TX/ /[-._A-Z]+_PL/ /[-._A-Z]+/) ],
            '/[-._a-z]+_pl/' => {
                _doc => 'Comipled Perl with access to incoming data in %R',
                _sub => $compileR
            },
            '/[-._a-z]+/' => {
                _doc => 'Any key value settings appropriate for the instance at hand'
            },
            '/[-._A-Z]+/' => {
                _doc => 'Grouped configuraiton options for complex inventory driver configurations',
                _vars => [ '/[a-z]\S+/' ],
                '/[-._a-z]\S+/' => {             
                    _doc => 'Any key value settings appropriate for the instance at hand'
                },
                '/[-._a-z]+_pl/' => {
                    _doc => 'Comipled Perl with access to incoming data in %R',
                    _sub => $compileR
                },
            },
            '/[-._A-Z]+_TX/' => {
                _doc => 'Text Section',
                _text => {}
            },
            '/[-._A-Z]+_PL/' => {
                _doc => 'Compiled Text Section with access to the record in %R',
                _text => {
                    _sub => $compileR
                }
            },
            'MAP' => {
                _doc => 'Mapping between inventory attributes and extopus attribute names.',
                _vars => [ '/[-._a-z]+/' ],
                '/[-._a-z]+/' => {
                    _doc => <<'DOC',
The value of an extopus attribute can either be the name of a inventory attribute OR a perl snippet refering the the inventory attributes via the %R hash.
The perl snippet mode gets activated if [$"'{;] appears in the value.
DOC
                    _example => 'address = $R{"inventory.street"} . " " . $R{"inventory.number"}',
                    _sub => $compileR,
                },
            },
            'TREE' => {
                _doc => <<'DOC',
Define the attributes to be added to the tree. By entering rows of comma separated
attributes in perl notation. The data from the current record is accessible via the %R hash.
DOC
                _example => <<'EX',
'Company Index',uc(substr($R{company},0,1)), uc(substr($R{company},1,1)),$R{company},$R{town},$R{street}
'Services', $R{service_class}, $R{service_id}, $R{location}
EX
                _text => {
                    _sub => sub { 
                        my $rules = $_[0];
                        my @t = split /\n/, $rules; 
                        my $perl = 'sub { my %R = (%{$_[0]}); return [ '.join(',',map {"[ $_ ]"} @t).' ] }';
                        # check and modify the _text in place ... sneaky ... 
                        $_[0] = eval $perl;  ## no critic (ProhibitStringyEval)
                        if ($@){
                            return "Failed to compile $perl: $@ ";
                        }
                        undef;
                    }
                }
            },
        },
        '/VISUALIZER:\s+\S+/' => {
            _order => 1,
            _doc => 'Instanciate a visualizer object',
            _vars => [ qw(module title caption /[-._a-z]+_pl/ /[-._a-z]+/) ],
            _mandatory => [ qw(module title caption) ],
            _sections => [qw(/[-._A-Z]+_TX/ /[-._A-Z]+_PL/ /[-._A-Z]+/) ],
            module => {
                _doc => 'The visualization module to load'
            },
            title => {
                _doc => 'The title for the visualizer tab'
            },
            caption => {
                _doc => 'Caption for the window if the tab gets broken out. Access Record via %R',
                _sub => $compileR,
            },
            '/[-._a-z]+/' => {
                _doc => 'Any key value settings appropriate for the instance at hand'
            },
            '/[-._a-z]+_pl/' => {
                _doc => 'Compiled Perl with access to the record in %R',
                _sub => $compileR
            },
            '/[-._A-Z]+/' => {
                _doc => 'Grouped configuraiton for complex visualization modules',
                _vars => [ '/[a-z]\S+/' ],
                '/[-._a-z]+/' => {             
                    _doc => 'Any key value settings appropriate for the instance at hand'
                },
                '/[-._a-z]+_pl/' => {
                    _doc => 'Comipled Perl with access to the record in %R',
                    _sub => $compileR
                },
            },
            '/[-._A-Z]+_TX/' => {
                _doc => 'Text Section',
                _text => {}
            },
            '/[-._A-Z]+_PL/' => {
                _doc => 'Compiled Text Section with access to the record in %R',
                _text => {
                    _sub => $compileR
                }
            },
        },
    };
    my $parser =  Config::Grammar->new ($grammar);
    return $parser;
}

1;
__END__

=head1 SEE ALSO

L<Config::Grammar>

=head1 COPYRIGHT

Copyright (c) 2011 by OETIKER+PARTNER AG. All rights reserved.

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

 2011-02-19 to 1.0 first version

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

