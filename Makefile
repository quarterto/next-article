PORT := 3003
app := ft-next-grumman
OBT := $(shell which origami-build-tools)
ROUTER := $(shell which next-router)
API_KEY := $(@shell cat ~/.ftapi)

.PHONY: test

install:
ifeq ($(OBT),)
	@echo "You need to install origami build tools first!  See docs here: http://origami.ft.com/docs/developer-guide/building-modules/"
	exit 1
endif
ifeq ($(ROUTER),)
	@echo "You need to install the next router first!  See docs here: https://github.com/Financial-Times/next-router"
	exit 1
endif
ifeq ($(API_KEY),)
	@echo "You need an api key!  Speak to one of the next team to get one"
	exit 1
endif
	origami-build-tools install

test:
	./node_modules/.bin/jshint `find . \\( -name '*.js' -o -name '*.json' \\) ! \\( -path './public/*' -o -path './tmp/*' -o -path './node-v0.10.32-linux-x64/*' -o -path './node_modules/*' -o -path './bower_components/*' -o -path './client/vendor/*' -o -name 'bundle.js' \\)`
	# Run all tests except for smoke tests
	export HOSTEDGRAPHITE_APIKEY=123; export ENVIRONMENT=production; ./node_modules/.bin/mocha --reporter spec -i -g 'smoke tests' tests/server/

smoke-test:
	# export DEBUG=ft-api-client:*,nock.*;
	export HOSTEDGRAPHITE_APIKEY=123; export PORT=${PORT}; export apikey=12345; export ENVIRONMENT=production; ./node_modules/.bin/mocha --reporter spec -g 'smoke tests' tests/server/


test-debug:
	./node_modules/.bin/mocha --debug-brk --reporter spec -i tests/server/

run:
	$(MAKE) -j2 _run

run-debug:
	$(MAKE) -j3 _run-debug

_run: run-local run-router

_run-debug: run-local-debug run-router run-local-debug-inspector

run-local:
	export HOSTEDGRAPHITE_APIKEY=123; export apikey=${API_KEY} ; export PORT=${PORT}; nodemon server/app.js --watch server

run-local-debug:
	export HOSTEDGRAPHITE_APIKEY=123; export apikey=${API_KEY} ; export PORT=${PORT}; nodemon --debug server/app.js
	# for all output from ft-api-client then switch to using this line for debug mode
	# export HOSTEDGRAPHITE_APIKEY=123; export apikey=${API_KEY} ; export DEBUG=ft-api-client*; export PORT=${PORT}; nodemon --debug server/app.js

run-local-debug-inspector:
	node-inspector;

run-router:
	export grumman=${PORT}; export PORT=5050; export DEBUG=proxy ; next-router

build:
	export ENVIRONMENT=development; ./node_modules/.bin/gulp

build-production:
	@./node_modules/.bin/bower install
	@./node_modules/.bin/gulp

watch:
	@./node_modules/.bin/gulp watch

clean:
	# Clean+install dependencies
	git clean -fxd
	$(MAKE) install

deploy:

	# Pre-deploy clean
	npm prune --production

	# Package+deploy
	@./node_modules/.bin/haikro build deploy \
		--app $(app) \
		--heroku-token $(HEROKU_AUTH_TOKEN) \
		--commit `git rev-parse HEAD` \
		--verbose

clean-deploy: clean deploy
