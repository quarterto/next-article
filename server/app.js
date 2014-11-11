'use strict';

require('es6-promise').polyfill();
var express = require('express');
var api = require('./utils/api');
var flags = require('next-feature-flags-client');
flags.init();

var swig = require('swig');

// create the app
var app = module.exports = express();


require('next-wrapper').setup(app, flags, {
    appname: 'grumman'
});

app.set('views', __dirname + '/../templates');
swig.setDefaults({ cache: false });

// not for production
app.set('view cache', false);

// set up middleware and routes 
// TODO: needs tidying up
app.use('/grumman', express.static(__dirname + '/../public'));


app.get('/', function(req, res) {
    res.redirect('/search?q=page:Front%20page');
});
app.get(/^\/fastft\/([0-9]+)(\/[\w\-])?/, require('./controllers/fastft'));
app.get(/^\/([a-f0-9]+\-[a-f0-9]+\-[a-f0-9]+\-[a-f0-9]+\-[a-f0-9]+)/, require('./controllers/methode'));
app.get('/more-on/:id', require('./controllers/more-on'));
app.get('/__gtg', function(req, res, next) {
  res.status(200).end();
});


// Start the app
var port = process.env.PORT || 3001;
app.listen(port, function() {
    console.log("Listening on " + port);
});
