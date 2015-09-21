'use strict';

var podcastGuidRegex = '[a-z0-9]{24}';
var articleUuidRegex = '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}';

var express = require('ft-next-express');
var logger = require('ft-next-logger');
var bodyParser = require('body-parser');
var app = module.exports = express();
var barriers = require('ft-next-barriers');
require('./lib/ig-poller').start();
require('./lib/blogs-access-poller').start();
app.use(bodyParser.json());

// COMPLEX: Put access middleware before barrier middleware so that access can be cached by membership
app.use('^/:id(' + articleUuidRegex + ')$', require('./controllers/access'));
app.get('^/content/:id(' + articleUuidRegex + ')$', require('./controllers/access'));

// No need for access control for podcasts
app.get('^/content/:id(' + podcastGuidRegex + ')$', require('./controllers/podcast'));
app.post('^/articles', require('./controllers/articles'));

// These routes supply supplement content for an article so don't need to go through barriers middleware
app.get('^/article/:id(' + articleUuidRegex + ')/story-package', require('./controllers/related/story-package'));
app.get('^/article/:id(' + articleUuidRegex + ')/more-on', require('./controllers/related/more-on'));
app.get('^/article/:id(' + articleUuidRegex + ')/special-report', require('./controllers/related/special-report'));
app.get('/embedded-components/slideshow/:id', require('./controllers/slideshow'));

// Use barriers middleware only before calling full article endpoints
app.use(barriers.middleware(express.metrics));
app.get('^/:id(' + articleUuidRegex + ')$', require('./controllers/interactive'));
app.get('^/:id(' + articleUuidRegex + ')$', require('./controllers/article'));
app.get('^/content/:id(' + articleUuidRegex + ')$', require('./controllers/article'));

app.get('/__gtg', function(req, res) {
	res.status(200).end();
});

// Start the app
var port = process.env.PORT || 3001;
module.exports.listen = app.listen(port, function() {
	logger.info("Listening on " + port);
});
