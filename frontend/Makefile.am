
AUTOMAKE_OPTIONS=foreign

EXTRA_DIST = compile.json  Manifest.json package.json package-lock.json $(shell find source -not -name ".*" -a -not -name "*~" -a -not -name "*.tmp" -a -not -name "Makefile*" -a -type f -print )

if BUILD_QOOXDOO_APP

all-local: build

.PHONY: source source-watch node_modules build clean

node_modules: node_modules/.installed

source: node_modules compiled/source/.built


source-watch: node_modules
	CALLBACKERY_QX=$(CALLBACKERY_QX) $(NPX) qx compile --watch --feedback=false --erase --update-po-files

build: ../public/.built

clean: node_modules
	$(NPX) qx clean

../public/.built: $(EXTRA_DIST) Makefile.in
	mkdir -p ../public
	$(MAKE) node_modules
	$(NPX) qx compile --target=build --feedback=false --update-po-files
	mkdir -p ../public/$(QX_CLASS)
	cp -p compiled/build/$(QX_CLASS)/*.js ../public/$(QX_CLASS)
	cp -p compiled/build/index.html ../public
	cp -ap compiled/build/resource   ../public
	$(PERL) -i -p -e 's/#VERSION#/$(PACKAGE_VERSION)/g;s/#YEAR#/$(YEAR)/g;s/#DATE#/$(DATE)/g;' ../public/$(QX_CLASS)/*.js ../public/index.html
	touch $@

YEAR := $(shell date +%Y)
DATE := $(shell date +%Y-%m-%d)


compiled/source/.built: $(EXTRA_DIST) Makefile.in
	$(NPX) qx compile --feedback=false --update-po-files
	touch $@

node_modules/.installed package-lock.json: package.json
	$(NPM) i
	touch $@
endif
