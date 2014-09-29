
run:
	@export apikey=`cat ~/.ftapi` ; nodemon server/app.js

build:
	ls .
	ls node_modules
	node-sass static/bullpup/styles.scss --stdout > static/bullpup/styles.css

heroku-cfg:
	@heroku config:set apikey=`cat ~/.ftapi`
