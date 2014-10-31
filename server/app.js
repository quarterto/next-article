'use strict';

require('es6-promise').polyfill();
var express = require('express');
var latest  = require('./jobs/latest');
var popular = require('./jobs/popular');
var api = require('./utils/api');
var Flags = require('./utils/flags');

// create the app
var app = module.exports = express();

// set up templating
var swig = require('swig');

require('./view-helpers/flag');
require('./view-helpers/resize');

app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/../templates');
swig.setDefaults({ cache: false });


// not for production
app.set('view cache', false);


// set up middleware and routes 
// TODO: needs tidying up
app.use('/dobi', express.static(__dirname + '/../public'));

if (process.env.NODE_ENV === 'production') {
    var raven = require('raven');
    app.use(raven.middleware.express(process.env.RAVEN_URL));
}

app.use(require('./middleware/auth'));


app.get('/', function(req, res) {
    res.redirect('/search?q=page:Front%20page');
});
app.get('/favourites', require('./controllers/favourites'));
app.get('/search', require('./controllers/search'));
app.get(/^\/fastft\/([0-9]+)(\/[\w\-])?/, require('./controllers/fastft'));
app.get(/^\/([a-f0-9]+\-[a-f0-9]+\-[a-f0-9]+\-[a-f0-9]+\-[a-f0-9]+)/, require('./controllers/methode'));
app.get('/more-on/:id', require('./controllers/more-on'));
app.get('/uber-nav', require('./controllers/uber-nav'));
app.get('/__gtg', function(req, res, next) {
  res.status(200).end();
});

app.use('/components', require('./components.js'));

// Start polling the data
latest.init();
popular.init();

// Start the app
var port = process.env.PORT || 3001;
app.listen(port, function() {
      console.log("Listening on " + port);
});
