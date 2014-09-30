
run: build
	@export apikey=`cat ~/.ftapi` ; nodemon server/app.js

build:
	@./node_modules/.bin/node-sass static/bullpup/styles.scss --stdout > static/bullpup/styles.css

heroku-cfg:
	@heroku config:set apikey=`cat ~/.ftapi`

tests:
	./node_modules/.bin/jshint `find . \\( -name '*.js' -o -name '*.json' \\) ! \\( -path './node_modules/*' -o -name '*.min.*' \\)`
	./node_modules/.bin/mocha
