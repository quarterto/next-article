
.PHONY: test
test:
	./node_modules/.bin/jshint `find . \\( -name '*.js' -o -name '*.json' \\) ! \\( -path './node_modules/*' -o -name '*.min.*' \\)`
	./node_modules/.bin/mocha

run: build
	@export apikey=`cat ~/.ftapi` ; nodemon server/app.js

build:
	@./node_modules/.bin/node-sass --source-comments normal static/styles.scss static/styles.css
	@./node_modules/.bin/node-sass --source-comments normal static/components/home/style.scss static/components/home/style.css

heroku-cfg:
	@heroku config:set apikey=`cat ~/.ftapi`
