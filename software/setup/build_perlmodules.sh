#!/bin/bash
## other decision structure
set -o errexit
# don't try to remember where things are
set +o hashall
## do not tollerate unset variables
set -u

if [ x$1 = 'x' ]; then
   echo "Missing destination directory."
   exit 1
fi

export LD_LIBRARY_PATH=

export PREFIX=$1

. `dirname $0`/module_builder.inc


perlmodule ExtUtils::CBuilder
perlmodule ExtUtils::ParseXS
perlmodule ExtUtils::Manifest
perlmodule Test::Harness
perlmodule Perl::OSType
perlmodule CPAN::Meta::YAML
perlmodule version
perlmodule Module::Metadata
perlmodule Module::Build
perlmodule Class::Method::Modifiers
perlmodule Devel::PPPort
perlmodule Test::More
perlmodule XSLoader
perlmodule Mouse
perlmodule Any::Moose
perlmodule Digest::MD5
perlmodule Tie::IxHash
perlmodule List::MoreUtils
perlmodule Params::Validate 
perlmodule Class::Load
perlmodule Class::Singleton
perlmodule parent
perlmodule DateTime::Locale
perlmodule DateTime::TimeZone
perlmodule DateTime
perlmodule boolean
perlmodule MongoDB
perlmodule Devel::NYTProf
perlmodule JSON::XS
perlmodule JSON
perlmodule JSON::Any
perlmodule Mojolicious
perlmodule Digest::SHA1
perlmodule MojoX::Session
perlmodule MojoX::Session::Store::MongoDB
