PM :=  $(shell find -L . -type d -name ".??*" -prune -o -not -name ".*" -a -not -name "*~" -a -not -name "*.tmp" -a -not -name "Makefile*"  -a -type f -print )
EXTRA_DIST = $(PM)
datadir = $(libdir)
nobase_data_DATA = $(PM)

dist-hook:
	$(PERL) -i -p -e 's/\$$VERSION\s*=\s*".+?";/\$$VERSION = "$(PACKAGE_VERSION)";/;'  $(DESTDIR)$(distdir)/lib/$(MJ_CLASS).pm
