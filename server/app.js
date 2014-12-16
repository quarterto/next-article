/*jshint node:true*/
'use strict';

var express = require('ft-next-express');
var Metrics = require('next-metrics');

Metrics.init({ app: 'grumman', flushEvery: 30000 });

var isAdSlot = require('./view-helpers/isAdSlot');

var app = module.exports = express({
	helpers: { isAdSlot: isAdSlot }
});

app.get('/', function(req, res) {
	res.redirect('/search?q=page:Front%20page');
});

app.get(/^\/fastft\/([0-9]+)(\/[\w\-])?/, require('./controllers/fastft'));
app.get(/^\/([a-f0-9]+\-[a-f0-9]+\-[a-f0-9]+\-[a-f0-9]+\-[a-f0-9]+)/, require('./controllers/capi'));
app.get('/more-on/:id', require('./controllers/more-on'));
app.get('/more-on/:metadata/:id', require('./controllers/more-on-topic'));
app.get('/__gtg', function(res, res) {
	res.status(200).end();
});

// Start the app
var port = process.env.PORT || 3001;
app.listen(port, function() {
	Metrics.count('express.start');
	console.log("Listening on " + port);
});
