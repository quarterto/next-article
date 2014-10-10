PORT := 3001

.PHONY: test
test:
	./node_modules/.bin/jshint `find . \\( -name '*.js' -o -name '*.json' \\) ! \\( -path './node_modules/*' -o -name '*.min.*' \\)`
	./node_modules/.bin/mocha

run:
	$(MAKE) -j2 _run

_run: run-local run-router

run-local: build
	export apikey=`cat ~/.ftapi` ; export PORT=${PORT}; nodemon server/app.js

run-router:
	export article=${PORT}; export dobi=${PORT}; export PORT=5050; export DEBUG=proxy ; next-router

build:
	@./node_modules/.bin/node-sass --source-comments normal static/styles.scss > static/styles.css
	@./node_modules/.bin/node-sass --source-comments normal static/components/home/style.scss > static/components/home/style.css

heroku-cfg:
	@heroku config:set apikey=`cat ~/.ftapi`
