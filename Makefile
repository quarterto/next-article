TEST_APP := "ft-article-branch-${CIRCLE_BUILD_NUM}"

.PHONY: test

install:
	obt install --verbose

test: verify unit-test

verify:
	nbt verify

unit-test:
	export apikey=12345; export api2key=67890; export ELASTIC_SEARCH_HOST=ft-elastic-search.com; export AWS_SIGNED_FETCH_DISABLE_DNS_RESOLUTION=true; export NODE_ENV=test; mocha test/server/ --recursive
	karma start test/client/karma.conf.js

test-debug:
	@mocha --debug-brk --reporter spec -i test/server/

run:
	nbt run

build:
	nbt build --dev

build-production:
	nbt build

watch:
	nbt build --dev --watch

clean:
	git clean -fxd

deploy:
	nbt configure --no-splunk
	nbt deploy-hashed-assets
	nbt deploy --skip-logging
	nbt scale

visual:
	# Note: || is not OR; it executes the RH command only if LH test is truthful.
	test -d ${CIRCLE_BUILD_NUM} || (export TEST_APP=${TEST_APP}; myrtlejs)

clean-deploy: clean install deploy

tidy:
	nbt destroy ${TEST_APP}

provision:
	nbt provision ${TEST_APP}
	nbt configure ft-next-article ${TEST_APP} --overrides "NODE_ENV=branch" --no-splunk
	nbt deploy-hashed-assets
	nbt deploy ${TEST_APP} --skip-enable-preboot --skip-logging
	make smoke

smoke:
	nbt test-urls ${TEST_APP} --throttle 1;
	export TEST_APP=${TEST_APP}; nbt nightwatch test/browser/tests/* -e ie9,ie10,ie11,firefox40,chrome44,chrome45,iphone6_plus,Android_Nexus7HD
