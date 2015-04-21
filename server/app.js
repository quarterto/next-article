'use strict';

var express = require('ft-next-express');
var app = module.exports = express();
var access = require('./controllers/access');
var logger = require('ft-next-logger');

var articleUuidRegex = '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}';

app.get('/', function(req, res) {
	res.redirect('/search?q=page:Front%20page');
});
app.use('^/:id(' + articleUuidRegex + ')', access);

app.get(/^\/fastft\/([0-9]+)(\/[\w\-])?/, require('./controllers/fastft'));
app.get(/^\/([a-f0-9]+\-[a-f0-9]+\-[a-f0-9]+\-[a-f0-9]+\-[a-f0-9]+)$/, require('./controllers/capi'));

app.get('^/:id(' + articleUuidRegex + ')/people', require('./controllers/related/people'));
app.get('^/:id(' + articleUuidRegex + ')/organisations', require('./controllers/related/organisations'));
app.get('^/:id(' + articleUuidRegex + ')/comments-hack', require('./controllers/comments-hack'));


// temporary (MA)
app.get('/more-on/useful', require('./controllers/useful'));
app.get('^/:id(' + articleUuidRegex + ')/feedback/:reason', access, require('./controllers/feedback'));

app.get('/more-on/:id', require('./controllers/more-on'));
app.get('/more-on/:metadata/:id', require('./controllers/more-on-topic'));

app.get('/embedded-components/slideshow/:id', require('./controllers/slideshow'));
app.get('/__gtg', function(req, res) {
	logger.info('gtg requested');
	res.status(200).end();
});

// Start the app
var port = process.env.PORT || 3001;
module.exports.listen = app.listen(port, function() {
	logger.info("Listening on " + port);
});
