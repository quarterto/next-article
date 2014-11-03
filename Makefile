PORT := 3001
app := ft-next-grumman

.PHONY: test


test:
	./node_modules/.bin/mocha --reporter spec -i tests/server/
	./node_modules/.bin/jshint `find . \\( -name '*.js' -o -name '*.json' \\) ! \\( -path './public/*' -o -path './tmp/*' -o -path './node-v0.10.32-linux-x64/*' -o -path './node_modules/*' -o -path './bower_components/*' -o -path './client/vendor/*' -o -name 'bundle.js' \\)`

test-debug:
	./node_modules/.bin/mocha --debug-brk --reporter spec -i tests/server/ 

run:
	$(MAKE) -j2 _run

_run: run-local run-router

run-local: build
	export apikey=`cat ~/.ftapi` ; export PORT=${PORT}; nodemon server/app.js --watch server

run-router:
	export grumman=${PORT}; export PORT=5050; export DEBUG=proxy ; next-router

debug: build
	export apikey=`cat ~/.ftapi` ; export PORT=${PORT}; node --debug-brk server/app.js

build:
	export ENVIRONMENT=development; ./node_modules/.bin/gulp

build-production:
	@./node_modules/.bin/gulp

watch:
	@./node_modules/.bin/gulp watch

clean:
	# Clean+install dependencies
	git clean -fxd
	npm install

deploy:
	./node_modules/.bin/bower install

	# Build steps
	$(MAKE) build-production

	# Pre-deploy clean
	npm prune --production

	# Package+deploy
	@./node_modules/.bin/haikro build deploy \
		--app $(app) \
		--token $(HEROKU_AUTH_TOKEN) \
		--commit `git rev-parse HEAD` \
		--verbose

clean-deploy: clean deploy
