
run:
	@export apikey=`cat ~/.ftapi` ; nodemon server/app.js
	
heroku-cfg:
	@heroku config:set apikey=`cat ~/.ftapi`
