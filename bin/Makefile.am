dist_bin_SCRIPTS = $(MJ_SCRIPT).pl

install-exec-hook:
	[ "$(PERL5LIB)" == "" ] || cd "$(DESTDIR)$(bindir)" && $(PERL) -i -p -e 's{.*# PERL5LIB}{use lib qw($(PERL5LIB)); # PERL5LIB}' $(dist_bin_SCRIPTS) || true
	cd "$(DESTDIR)$(bindir)" && $(PERL) -i -p -e 's{.*# LIBDIR}{use lib qw($(libdir)); # LIBDIR}' $(dist_bin_SCRIPTS)
	cd "$(DESTDIR)$(bindir)" && $(PERL) -i -p -e 's{^#!.*perl.*}{#!$(PERL)};' $(dist_bin_SCRIPTS)
