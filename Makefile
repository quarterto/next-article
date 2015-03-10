PORT := 3003
app := ft-next-grumman-v002
OBT := $(shell which origami-build-tools)
ROUTER := $(shell which next-router)
API_KEY := $(shell cat ~/.ftapi 2>/dev/null)
API2_KEY := $(shell cat ~/.ftapi_v2 2>/dev/null)
GIT_HASH := $(shell git rev-parse --short HEAD)
TEST_HOST := "ft-grumman-branch-${GIT_HASH}"
TEST_URL ?= "http://ft-grumman-branch-${GIT_HASH}.herokuapp.com/"
TEN_MINS_FROM_NOW := $(shell node -e "var d = new Date(); d.setMinutes(d.getMinutes() + 10); console.log(d.toISOString())")


.PHONY: test

install:
ifeq ($(OBT),)
	@echo "You need to install origami build tools first!  See docs here: http://origami.ft.com/docs/developer-guide/building-modules/"
	exit 1
endif
	origami-build-tools install

test:
	next-build-tools verify
	# Run all tests except for smoke tests
	export HOSTEDGRAPHITE_APIKEY=123; export ENVIRONMENT=production; mocha --reporter spec -i -g 'smoke tests' tests/server/

smoke-test:
	export HOSTEDGRAPHITE_APIKEY=123; export PORT=${PORT}; export apikey=12345; export api2key=67890; export ENVIRONMENT=production; mocha --reporter spec -g 'smoke tests' tests/server/

test-debug:
	@mocha --debug-brk --reporter spec -i tests/server/

run:
ifeq ($(ROUTER),)
	@echo "You need to install the next router first!  See docs here: http://git.svc.ft.com/projects/NEXT/repos/router/browse"
	exit 1
endif
ifeq ($(API_KEY),)
	@echo "You need an api key!  Speak to one of the next team to get one"
	exit 1
endif
ifeq ($(API2_KEY),)
	@echo "You need an api key for CAPI v2! Speak to one of the next team to get one"
	exit 1
endif
	$(MAKE) -j2 _run

run-debug:
	$(MAKE) -j3 _run-debug

_run: run-local run-router

_run-debug: run-local-debug run-router run-local-debug-inspector

run-local:
	export HOSTEDGRAPHITE_APIKEY=123; export apikey=${API_KEY}; export api2key=${API2_KEY}; export PORT=${PORT}; nodemon server/app.js --watch server

run-local-debug:
	export HOSTEDGRAPHITE_APIKEY=123; export apikey=${API_KEY} ; export PORT=${PORT}; nodemon --debug server/app.js
	# for all output from ft-api-client then switch to using this line for debug mode
	# export HOSTEDGRAPHITE_APIKEY=123; export apikey=${API_KEY} ; export DEBUG=ft-api-client*; export PORT=${PORT}; nodemon --debug server/app.js

run-local-debug-inspector:
	node-inspector;

run-router:
	export grumman=${PORT}; export PORT=5050; export DEBUG=proxy ; next-router

build:
	export ENVIRONMENT=development; gulp build-dev;

build-production:
	@bower install
	@gulp build-prod

watch:
	export ENVIRONMENT=development; gulp watch

clean:
	git clean -fxd

deploy:
	next-build-tools configure
	next-build-tools deploy
	
clean-deploy: clean install deploy

provision:
	next-build-tools provision ${TEST_HOST}
	next-build-tools configure ft-next-grumman-v002 ${TEST_HOST} --overrides "NODE_ENV=branch,DEBUG=*,EXPIRY=${TEN_MINS_FROM_NOW},APP_NAME=${TEST_HOST},HEROKU_AUTH_TOKEN=${HEROKU_AUTH_TOKEN}"
	next-build-tools deploy ${TEST_HOST}
	npm install
	make smoke

smoke:
	export TEST_URL=${TEST_URL}; ./node_modules/nightwatch/bin/nightwatch --test tests/browser/tests/jssuccesstest.js --config ./tests/browser/nightwatch.json -e ie10,firefox,chrome
