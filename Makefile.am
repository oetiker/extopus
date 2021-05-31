#  Copyright (C) 2017 Tobias Oetiker

AUTOMAKE_OPTIONS =  foreign


SUBDIRS = bin lib thirdparty etc frontend

PUB := $(shell find -L public -type d \( -name ".??*" -o -name transpiled \) -prune -o -not -name "*db.json" -a -not -name "*.map" -a -not -name "*~" -a -not -name transpiled -a -not -name "*.tmp"  -a -type f -print )

TEMPL := $(shell test -d templates && find -L templates -type f -name "*.ep")
SHARE := $(shell test -d share && find -L share -type d -name ".??*" -prune -o -not -name ".*" -a -not -name "*~" -a -not -name "*.tmp"  -a -type f -print)

PERLTESTS := $(shell find t -name "*.t")
PM := $(shell find lib -name "*.pm")

EXTRA_DIST = VERSION cpanfile COPYRIGHT LICENSE CHANGES AUTHORS bootstrap $(PUB) $(wildcard t/*.t) $(POD) $(TEMPL) $(PERLTESTS) $(SHARE)

YEAR := $(shell date +%Y)
DATE := $(shell date +%Y-%m-%d)

datadir = $(prefix)
nobase_data_DATA = $(PUB) $(TEMPL) $(SHARE)

README COPYRIGHT: VERSION
	$(PERL) -i -p -e 's/(#VERSION#|\d+\.\d+\.\d+[^.\s]*)/$(PACKAGE_VERSION)/g;s/(#YEAR#|20[1-9]\d)/$(YEAR)/g;s/(#DATE#|20[1-9]\d-[01]\d-[0-3]\d)/$(DATE)/g;' $@

all-local: share/messages.pot

clean-local:
	rm share/messages.pot

LANGUAGES := $(shell  $(PERL) -e 'use JSON::PP qw(decode_json); print join(" ", map {"share/".$$_.".po"} @{decode_json(join("",<>))->{locales}})' frontend/compile.json)

share/messages.pot: $(PM) $(TEMPL)
	mkdir -p share
	$(XGETTEXT) --sort-output --language=perl --package-name=$(PACKAGE) --package-version=$(VERSION) --from-code=UTF-8 --keyword=trm:1 --keyword=tra:1 --output=share/messages.pot $(PM) $(TEMPL)
	$(XGETTEXT) --sort-output --join --language=php --package-name=$(PACKAGE) --package-version=$(VERSION) --from-code=UTF-8 --keyword=tra:1 --output=share/messages.pot $(TEMPL)
	sed -i 's/; charset=CHARSET/; charset=UTF-8/' share/messages.pot
	for lang in $(LANGUAGES); do \
		( test -f $$lang || cp share/messages.pot $$lang ); \
		$(MSGMERGE) --no-fuzzy-matching --sort-output --force-po -U $$lang share/messages.pot; \
	done

INSTANCE := $(shell echo $$$$)
test:
	prove -w

