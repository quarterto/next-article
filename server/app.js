'use strict';

var express = require('ft-next-express');
var bodyParser = require('body-parser');
var checks = require('./checks/main.js');

// Starts polling checks
checks.init();

var app = module.exports = express({
	name: 'article',
	healthChecks: [
		checks.esv3,
		checks.livefyre,
		checks.errorRate
	]
});

var logger = express.logger;
var barriers = require('ft-next-barriers');
require('./lib/ig-poller').start();
require('./lib/blogs-access-poller').start();
app.use(bodyParser.json());

// COMPLEX: Put access middleware before barrier middleware so that access can be cached by membership
app.use('^/content/:id$', require('./controllers/access'));

// These routes supply supplement content for an article so don't need to go through barriers middleware
app.get('^/article/:id/story-package', require('./controllers/related/story-package'));
app.get('^/article/:id/more-on', require('./controllers/related/more-on'));
app.get('^/article/:id/special-report', require('./controllers/related/special-report'));
app.get('^/article/:id/social-counts', require('./controllers/related/social-counts'));
app.get('/embedded-components/slideshow/:id', require('./controllers/slideshow'));

// Use barriers middleware only before calling full article endpoints
app.use(barriers.middleware(express.metrics));

app.get('^/content/:id$', require('./controllers/negotiation'));

app.get('/__gtg', function(req, res) {
	res.status(200).end();
});

// Start the app
var port = process.env.PORT || 3001;
module.exports.listen = app.listen(port, function() {
	logger.info("Listening on " + port);
});
