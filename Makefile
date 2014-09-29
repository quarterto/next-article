
run: build
	@export apikey=`cat ~/.ftapi` ; nodemon server/app.js

build:
	node-sass static/bullpup/styles.scss --stdout > static/bullpup/styles.css

heroku-cfg:
	@heroku config:set apikey=`cat ~/.ftapi`
