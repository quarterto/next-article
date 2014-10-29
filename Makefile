PORT := 3001

.PHONY: test

verify:
	./node_modules/.bin/jshint `find . \\( -name '*.js' -o -name '*.json' \\) ! \\( -path './node_modules/*' -o -name '*.min.*' \\)`

test:
	./node_modules/.bin/mocha --reporter spec -i tests/server/

test-debug:
	./node_modules/.bin/mocha --debug-brk --reporter spec -i tests/server/ 

run:
	$(MAKE) -j2 _run

_run: run-local run-router

run-local: build
	export apikey=`cat ~/.ftapi` ; export PORT=${PORT}; nodemon server/app.js --watch server

debug: build
	export apikey=`cat ~/.ftapi` ; export PORT=${PORT}; node --debug-brk server/app.js

run-router:
	export dobi=${PORT}; export PORT=5050; export DEBUG=proxy ; next-router

build:
	@./node_modules/.bin/gulp

watch:
	@./node_modules/.bin/gulp watch

heroku-cfg:
	@heroku config:set apikey=`cat ~/.ftapi`
	@heroku config:add BUILDPACK_URL=https://github.com/ddollar/heroku-buildpack-multi.git
