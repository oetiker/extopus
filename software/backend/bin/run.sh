#! /bin/sh
export PATH=/usr/pack/perl-ubuntu804amd64-5.12.3-to/bin:$PATH
export MOJO_PROXY=1
export QX_SRC_MODE=1
#export QX_SRC_PATH=
export HTTP_PROXY=http://localhost:31283
#export PERL5OPT="-I../../thirdparty/lib/perl5 -d:NYTProf"
#export NYTPROF=start=no
export EXTOPUS_CONF=/home/oetiker/checkouts/extopus/software/backend/etc/extopus.cfg
exec ./ep.pl daemon --listen 'http://*:18476'
