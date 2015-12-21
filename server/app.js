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
require('./lib/ig-poller').start();
require('./lib/blogs-access-poller').start();
app.use(bodyParser.json());

app.get('^/article/:id/story-package', require('./controllers/related/story-package'));
app.get('^/article/:id/more-on', require('./controllers/related/more-on'));
app.get('^/article/:id/special-report', require('./controllers/related/special-report'));
app.get('^/article/:id/social-counts', require('./controllers/related/social-counts'));
app.get('/embedded-components/slideshow/:id', require('./controllers/slideshow'));

app.get('^/content/:id$', require('./controllers/negotiation'));

app.get('/__gtg', function(req, res) {
	res.status(200).end();
});

// Start the app
var port = process.env.PORT || 3001;
module.exports.listen = app.listen(port, function() {
	logger.info("Listening on " + port);
});
