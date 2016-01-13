TEST_APP := "ft-article-branch-${CIRCLE_BUILD_NUM}"

.PHONY: test

install:
	obt install --verbose

test: verify unit-test

verify:
	nbt verify

coverage:
	export apikey=12345; export api2key=67890; export AWS_SIGNED_FETCH_DISABLE_DNS_RESOLUTION=true; export NODE_ENV=test; istanbul cover node_modules/.bin/_mocha test/server/ -- --recursive

unit-test:
	export apikey=12345; export api2key=67890; export AWS_SIGNED_FETCH_DISABLE_DNS_RESOLUTION=true; export NODE_ENV=test; mocha test/server/ --recursive --inline-diffs --reporter nyan

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
	git clean -fxd -e .idea

deploy:
	nbt deploy-hashed-assets
	nbt ship -m

visual:
	# Note: || is not OR; it executes the RH command only if LH test is truthful.
	test -d ${CIRCLE_BUILD_NUM} || (export TEST_APP=${TEST_APP}; myrtlejs)

clean-deploy: clean install deploy

tidy:
	nbt destroy ${TEST_APP}

provision:
	nbt deploy-hashed-assets
	nbt float -md --testapp ${TEST_APP}
	make smoke

smoke:
	nbt test-urls ${TEST_APP} --throttle 1;
	# TODO: re-enable firefox
	export TEST_APP=${TEST_APP}; nbt nightwatch test/browser/tests/* -e ie9,ie11,chrome,firefox,iphone6_plus,Android_Nexus7HD
