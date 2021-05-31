requires 'Mojolicious';
requires 'Mojolicious::Plugin::Qooxdoo';
requires 'Mojo::Server::FastCGI';
requires 'Config::Grammar';
requires 'JSON::XS';
requires 'YAML';
requires 'Params::Validate';
requires 'SIAM';
requires 'DBD::SQLite';
requires 'Excel::Writer::XLSX';
requires 'Spreadsheet::WriteExcel';
requires 'IO::Socket::SSL';
if ($ENV{ORACLE_HOME}) {
  requires 'DBD::Oracle';
}
else {
    print <<'ORACLE_END';
=====================================================================
If you want to install the DBD::Oracle to allow oracle-db-access frommacs 
SIAM, make sure you have the ORACLE_HOME environment variable
pointing to the location where you have the Oracle Instant Client
and the SDK unpacked. Get your copies of these files from 

https://www.oracle.com/database/technologies/instant-client/linux-x86-64-downloads.html

Then run:

$ touch cpanfile
$ ORACLE_HOME=/where/you/unpacked/instantclient_21_1 make
=====================================================================
ORACLE_END
}