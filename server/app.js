'use strict';

var express = require('ft-next-express');
var logger = require('ft-next-logger');
var app = module.exports = express();
var barriers = require('ft-next-barriers');
require('./lib/ig-poller').start();

app.use(barriers.middleware(express.metrics));

var articleUuidRegex = '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}';

app.use('^/:id(' + articleUuidRegex + ')$', require('./utils/access'));
app.get('^/:id(' + articleUuidRegex + ')$', require('./controllers/interactive'));
app.get('^/:id(' + articleUuidRegex + ')$', require('./controllers/article'));
app.get('^/article/:id(' + articleUuidRegex + ')/people', require('./controllers/related/people'));
app.get('^/article/:id(' + articleUuidRegex + ')/organisations', require('./controllers/related/organisations'));
app.get('^/article/:id(' + articleUuidRegex + ')/topics', require('./controllers/related/topics'));
app.get('^/article/:id(' + articleUuidRegex + ')/regions', require('./controllers/related/regions'));
app.get('^/article/:id(' + articleUuidRegex + ')/story-package', require('./controllers/related/story-package'));
app.get('^/article/:id(' + articleUuidRegex + ')/more-on', require('./controllers/related/more-on'));

app.get('/embedded-components/slideshow/:id', require('./controllers/slideshow'));
app.get('/__gtg', function(req, res) {
	res.status(200).end();
});

// Start the app
var port = process.env.PORT || 3001;
module.exports.listen = app.listen(port, function() {
	logger.info("Listening on " + port);
});
