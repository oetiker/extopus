#  Copyright (C) 2011  Tobi Oetiker
#
#  This program is free software; you can redistribute it and/or modify
#  it under the terms of the GNU General Public License as published by
#  the Free Software Foundation; either version 2 of the License, or
#  (at your option) any later version.
#
#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.
#
#  You should have received a copy of the GNU General Public License
#  along with this program; if not, write to the Free Software
#  Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307, USA.

#


AC_INIT([extopus],[0.2.4],[tobi@oetiker.ch])
AC_PREREQ([2.59])
AC_CONFIG_AUX_DIR(conftools)


# AC_CANONICAL_TARGET
m4_version_prereq(2.60, [AC_USE_SYSTEM_EXTENSIONS], [#])
# need this to allow long path names
AM_INIT_AUTOMAKE([1.9 tar-ustar foreign])
AM_MAINTAINER_MODE

m4_ifdef([AM_SILENT_RULES], [AM_SILENT_RULES([yes])])

AC_PREFIX_DEFAULT(/opt/extopus-$PACKAGE_VERSION)

AC_ARG_VAR(PERL,   [Path to local perl binary])
AC_PATH_PROG(PERL, perl, no)

ac_perl_version="5.10.1"

if test "x$PERL" != "x"; then
  AC_MSG_CHECKING(for perl version greater than or equal to $ac_perl_version)
  $PERL -e "use $ac_perl_version;" >/dev/null 2>&1
  if test $? -ne 0; then
    AC_MSG_RESULT(no);
    AC_MSG_ERROR(at least version 5.10.1 is required to run extopus)
  else
    AC_MSG_RESULT(ok);
  fi
else
  AC_MSG_ERROR(could not find perl)
fi

AC_ARG_VAR(GMAKE,   [Path to local GNU Make binary])
AC_PATH_PROGS(GMAKE, [gnumake gmake make])

AC_MSG_CHECKING([checking for gnu make availablility])
if  ( $GMAKE --version 2> /dev/null | $GREP GNU  > /dev/null 2>&1 );  then
    AC_MSG_RESULT([$GMAKE is GNU make])
else
    AC_MSG_ERROR([GNU make not found. Try setting the GMAKE environment variable.])
fi

AC_ARG_ENABLE(pkgonly,
        AC_HELP_STRING([--enable-pkgonly],
                        [Skip all checking]))
AC_SUBST(enable_pkgonly)

HTDOCSDIR=${prefix}/htdocs
AC_ARG_WITH(htdocs-dir,AC_HELP_STRING([--with-htdocs-dir=DIR],[Where to install htdocs [PREFIX/htdocs]]), [HTDOCSDIR=$withval])
AC_SUBST(HTDOCSDIR)

QOOXDOO_PATH=
AC_ARG_WITH(qooxdoo-sdk,AC_HELP_STRING([--with-qooxdoo-sdk=DIR],[Where can we find the qooxdoo sdk (required to rebuild the web ui)]), [
        if test -d $withval/framework; then
             QOOXDOO_PATH=$withval
        else
        cat <<NOTES

** Aborting Configure ******************************
   
   You specified --with-qooxdoo-sdk=DIR without pointing it
   to a copy of the qooxdoo sdk. If you specify the option,
   make sure there is a copy of the qooxdoo sdk present.
   get your copy form www.qooxdoo.org.

NOTES
          exit 1
        fi
])

AC_SUBST(QOOXDOO_PATH)

AM_CONDITIONAL(BUILD_QOOXDOO_APP,[test x$QOOXDOO_PATH != x])

AC_ARG_VAR(PERL5LIB,   [Colon separated list of perl library directories])
AC_SUBST(PERL5LIB)

# Check the necessary Perl modules

mod_ok=1
if test "$enable_pkgonly" != yes; then
   prfx=$prefix
   if test x$prfx = xNONE; then
       prfx=$ac_default_prefix
   fi
   for module in \
     Mojolicious \
     MojoX::Dispatcher::Qooxdoo::Jsonrpc \
     Mojo::Server::FastCGI \
     Config::Grammar \
     SIAM \
     DBD::SQLite \
     JSON::XS \
     Mojo::JSON::Any \
     Excel::Writer::XLSX  \   
     Spreadsheet::WriteExcel
   do 
     AC_MSG_CHECKING([checking for perl module '$module'])
     if ${PERL} -I$prfx/thirdparty/lib/perl5 -e 'use '$module 2>/dev/null ; then
         AC_MSG_RESULT([Ok])
     else
         AC_MSG_RESULT([Failed])
         mod_ok=0
     fi
   done
   if test x$mod_ok = x0; then
        cat <<NOTES

** Aborting Configure ******************************
   
   If you know where perl can find the missing modules, set
   the PERL5LIB environment variable accordingly.

   FIRST though, make sure that 'perl' starts the perl
   binary you want to use for extopus.

   You can install local copies of the missing modules 
   by running

     ./setup/build-perl-modules.sh ${prfx}/thirdparty

NOTES
      exit 1
 fi

fi


AC_CONFIG_FILES([
	Makefile
	backend/Makefile
	frontend/Makefile
])

AC_SUBST(VERSION)

AC_OUTPUT

if test x$QOOXDOO_PATH = x; then

cat <<NOTES

*******************************************************
   
You did NOT specify the --with-qooxdoo-sdk configuration
option. So I do not have the means of re-compiling the
javascript parts (webinterface) of the application. If
you intend to modify them, make sure to re-configure
with qooxdoo-sdk link provided.

Now back to our regular broadcast ...

NOTES
fi

cat <<NOTES

** Ready to install extopus ******************************
   
   Settings:

     PERL5LIB = ${PERL5LIB:-"not set"}
     PERL = $PERL

   The extopus Makefiles uses GNU make functionality.
   Continue installation with

     $GMAKE install

NOTES
