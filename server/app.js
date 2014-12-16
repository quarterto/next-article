'use strict';

require('es6-promise').polyfill();

var express = require('express');
var api = require('./utils/api');
var flags = require('next-feature-flags-client');
var Metrics = require('next-metrics');
var errorMiddleware = require('express-errors-handler').middleware;

flags.init();

Metrics.init({ app: 'grumman', flushEvery: 30000 });

var swig = require('swig');

require('./view-helpers/isAdSlot');

// create the app
var app = module.exports = express();


var wrapper = require('next-wrapper');

wrapper.setup(app, flags, {
	appname: 'grumman'
});

app.set('views', __dirname + '/../templates');
swig.setDefaults({ cache: false });

// not for production
app.set('view cache', false);

var assets = express.Router();
assets.use('/', express.static(require('path').join(__dirname, '../public'), {
    maxAge: 120000 // 2 minutes
}));
app.use('/grumman', assets);

app.get('/', function(req, res) {
	res.redirect('/search?q=page:Front%20page');
});
app.get(/^\/fastft\/([0-9]+)(\/[\w\-])?/, require('./controllers/fastft'));
app.get(/^\/([a-f0-9]+\-[a-f0-9]+\-[a-f0-9]+\-[a-f0-9]+\-[a-f0-9]+)/, require('./controllers/capi'));
app.get('/more-on/:id', require('./controllers/more-on'));
app.get('/more-on/:metadata/:id', require('./controllers/more-on-topic'));
app.get('/__gtg', function(req, res, next) {
	res.status(200).end();
});

app.use(errorMiddleware);

// Start the app
var port = process.env.PORT || 3001;
app.listen(port, function() {
    Metrics.count('express.start');
    console.log("Listening on " + port);
});
