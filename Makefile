GIT_HASH := $(shell git rev-parse --short HEAD)
TEST_APP := "ft-article-branch-${GIT_HASH}"

.PHONY: test

install:
	obt install --verbose

test: verify build-production unit-test

verify:
	nbt verify

unit-test:
	export apikey=12345; export api2key=67890; export ELASTIC_SEARCH_HOST=ft-elastic-search.com; export NODE_ENV=test; mocha test/server/ --recursive
	karma start test/client/karma.conf.js

test-debug:
	@mocha --debug-brk --reporter spec -i test/server/

run:
	nbt run --harmony

build:
	nbt build --dev

build-production:
	nbt build
	nbt about

watch:
	nbt build --dev --watch

clean:
	git clean -fxd

deploy:
	nbt configure
	nbt deploy-hashed-assets
	nbt deploy --docker
	nbt scale

visual:
	test ${CI_PULL_REQUEST} == "" || (export TEST_APP=${TEST_APP}; myrtlejs)

clean-deploy: clean install deploy

tidy:
	nbt destroy ${TEST_APP}

provision:
	nbt provision ${TEST_APP}
	nbt configure ft-next-article ${TEST_APP} --overrides "NODE_ENV=branch"
	nbt deploy-hashed-assets
	nbt deploy ${TEST_APP} --skip-enable-preboot --docker
	make -j2 visual smoke

smoke:
	export TEST_APP=${TEST_APP}; nbt nightwatch test/browser/tests/*
