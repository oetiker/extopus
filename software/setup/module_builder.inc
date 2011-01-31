EPREFIX=${EPREFIX:-$PREFIX}
WORKDIR=${WORKDIR:-$PREFIX/src}

# default
KEEP=no

# make sure we find anything we preinstall
export PATH=$EPREFIX/bin:$PATH
# tell pkg-config where to look for *.pc files
export PKG_CONFIG_PATH=${PKG_CONFIG_PATH:-/usr/lib/pkgconfig}
# just to make sure those who are not compiled propperly still work
export LD_LIBRARY_PATH=$EPREFIX/lib

[ -d $WORKDIR ] || mkdir -p $WORKDIR

function prepare () {
 cd $WORKDIR
 if [ ! -f $2.ok ]
 then 
   echo "**** doing $2 ****"
   [ -f $2 ] || wget   --tries=0 --random-wait --passive-ftp $1/$2
   unset SRCDIR
   [ -f $2.srcdir ] && SRCDIR=`cat $2.srcdir`
   case $2 in
     *.tar.bz2)
         SRCDIR=${SRCDIR:-$WORKDIR/`basename $2 .tar.bz2`}
         [ -d $SRCDIR ] || bunzip2 -c $2 | tar xf -;;
     *.tar.gz)
         SRCDIR=${SRCDIR:-$WORKDIR/`basename $2 .tar.gz`}
         [ -d $SRCDIR ] || gunzip -c $2 | tar xf -;;
     *.tgz)
         SRCDIR=${SRCDIR:-$WORKDIR/`basename $2 .tgz`}
         [ -d $SRCDIR ] || gunzip -c $2|tar xf -;;
     *.tar.Z)
         SRCDIR=${SRCDIR:-$WORKDIR/`basename $2 .tar.Z`}
         [ -d $SRCDIR ] || gunzip -c $2|tar xf -;;
     *.tar)
         SRCDIR=${SRCDIR:-$WORKDIR/`basename $2 .tar`}
         [ -d $SRCDIR ] || tar xf $2;;
     *.zip)
         SRCDIR=${SRCDIR:-$WORKDIR/`basename $2 .zip`}
	 [ -d $SRCDIR ] || unzip -a $2 || exit 1;;

     *)  echo "Don't know how to unpack $2"
   esac
   if [ ! -d $SRCDIR ]; then
   	SRCDIR=`ls -F1tc $WORKDIR | grep / | head -1 | sed 's/\/$//'`
	echo $SRCDIR >$2.srcdir
   fi
   cd $SRCDIR
 else
   echo "**** skipping $2 ****"
   cd $WORKDIR
   return 1
 fi
}

function remove () {
    DIR=`pwd`    
    case $DIR in
        $WORKDIR/*)
                cd ..
                if [ x$KEEP = xyes ]; then
                        echo Keeping $DIR
                else
                        rm -rf $DIR
                fi
                ;;
        *)
                echo OOPS I wont remove $DIR because it is not in $WORKDIR
                exit 1
                ;;
    esac
}

function perlmodule (){
 path=$1;shift
 PERL=${PERL:-/usr/bin/perl}
# if $PERL -e "use $path" >/dev/null 2>&1; then
#     printf "permodule $path is already installed. skipping\n"
#     return
# fi
 if [ "${path##*/}" = "${path}" ]; then
        cd $WORKDIR
	wget --quiet --timestamping http://www.cpan.org/modules/02packages.details.txt.gz
	if [ 02packages.details.txt.gz -nt 02packages.details.txt ]; then
		gunzip -c 02packages.details.txt.gz > 02packages.details.txt
	fi
	temp=$(grep "^$path " 02packages.details.txt|head -1)
	temp="${temp##* }"
	pack="${temp##*/}"
	path=http://www.cpan.org/authors/id/"${temp%/*}"
 else
        pack=${1:-""};shift
 fi
 if prepare "$path" "$pack"
 then
   simpleprogram=$pack
   rm -f config.cache 
   PERL_VERSION=`$PERL -e 'printf "%vd\n", $^V;'`
   export PERL5LIB=$PREFIX/lib/perl:${PERL5LIB:-}
   if [ -f Build.PL ]; then
     echo "Running Build.PL"
     $PERL Build.PL \
        --installdirs=vendor \
        --config installvendorarch=lib/perl/$PERL_VERSION/`$PERL -MConfig -e 'print $Config{archname}'` \
        --config installvendorlib=lib/perl/$PERL_VERSION \
        --config installvendorbin=bin \
        --config installvendorman3dir=man/man3 \
        --config installvendorman1dir=man/man1 \
        --destdir=$PREFIX "$@" 2>&1 | tee -a ../${simpleprogram}.output
        [ ${PIPESTATUS[0]} = 0 ] || exit ${PIPESTATUS[0]} 
       ./Build 2>&1 | tee -a ../${simpleprogram}.output
         [ ${PIPESTATUS[0]} = 0 ] || exit ${PIPESTATUS[0]} 
        ./Build install 2>&1 | tee -a ../${simpleprogram}.output 
         [ ${PIPESTATUS[0]} = 0 ] || exit ${PIPESTATUS[0]} 
   else
   # if [ -f Makefile.PL ]; then
     echo "Running Makefile.PL"
     $PERL Makefile.PL \
        LIB=$PREFIX/lib/perl/$PERL_VERSION PREFIX=$PREFIX "$@" 2>&1 | tee -a ../${simpleprogram}.output
     [ ${PIPESTATUS[0]} = 0 ] || exit ${PIPESTATUS[0]}     
     make   2>&1 | tee -a ../${simpleprogram}.output
     [ ${PIPESTATUS[0]} = 0 ] || exit ${PIPESTATUS[0]}     
     make install 2>&1 | tee -a ../${simpleprogram}.output
     [ ${PIPESTATUS[0]} = 0 ] || exit ${PIPESTATUS[0]}     
   fi
   remove 
   touch ${simpleprogram}.ok
 fi
 cd $WORKDIR
}


# vim: ft=sh
