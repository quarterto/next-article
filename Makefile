PORT := 3003
app := ft-next-grumman
BUNDLER_EXISTS := $(shell which bundler)

.PHONY: test

install:
ifeq ($(BUNDLER_EXISTS),)
	@echo "Install Bundler globally"
	@sudo gem install bundler
endif
	@echo "\nInstalling Ruby gems…"
	@bundle install
	@echo "\nInstalling Node modules. This might take a while…"
	@npm install --silent
	@echo "\nInstalling Bower components…"
	@./node_modules/.bin/bower install --silent
	@echo "\nBuilding project assets…"
	@$(MAKE) build
	@echo "\nRunning smoke tests…"
	@$(MAKE) smoke-test
	@echo "\nYou're good to go!\nType 'make run' and open http://localhost:5050"

test:
	./node_modules/.bin/jshint `find . \\( -name '*.js' -o -name '*.json' \\) ! \\( -path './public/*' -o -path './tmp/*' -o -path './node-v0.10.32-linux-x64/*' -o -path './node_modules/*' -o -path './bower_components/*' -o -path './client/vendor/*' -o -name 'bundle.js' \\)`
	# Run all tests except for smoke tests
	export HOSTEDGRAPHITE_APIKEY=123; export ENVIRONMENT=production; ./node_modules/.bin/mocha --reporter spec -i -g 'smoke tests' tests/server/

smoke-test:
	# export DEBUG=ft-api-client:*,nock.*; 
	export PORT=${PORT}; export apikey=12345; export ENVIRONMENT=production; ./node_modules/.bin/mocha --reporter spec -g 'smoke tests' tests/server/


test-debug:
	./node_modules/.bin/mocha --debug-brk --reporter spec -i tests/server/ 

run:
	$(MAKE) -j2 _run

_run: run-local run-router

run-local:
	export HOSTEDGRAPHITE_APIKEY=123; export apikey=`cat ~/.ftapi` ; export PORT=${PORT}; nodemon server/app.js --watch server

run-router:
	export grumman=${PORT}; export PORT=5050; export DEBUG=proxy ; next-router

debug:
	export apikey=`cat ~/.ftapi` ; export PORT=${PORT}; node --debug-brk server/app.js

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
