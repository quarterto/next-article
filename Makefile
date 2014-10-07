
.PHONY: test
test:
	./node_modules/.bin/jshint `find . \\( -name '*.js' -o -name '*.json' \\) ! \\( -path './node_modules/*' -o -name '*.min.*' \\)`
	./node_modules/.bin/mocha

run: build
	@export apikey=`cat ~/.ftapi` ; nodemon server/app.js

build:
	@./node_modules/.bin/node-sass static/styles.scss --stdout > static/styles.css

heroku-cfg:
	@heroku config:set apikey=`cat ~/.ftapi`
