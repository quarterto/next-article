
run:
	@export apikey=`cat ~/.ftapi` ; nodemon server/app.js

compile:
	./node_modules/.bin/node-sass static/bullpup/styles.scss -o static/bullpup/styles.css

heroku-cfg:
	@heroku config:set apikey=`cat ~/.ftapi`
