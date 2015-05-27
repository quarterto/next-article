'use strict';

var express = require('ft-next-express');
var logger = require('ft-next-logger');
var app = module.exports = express();

var articleUuidRegex = '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}';

app.use('^/:id(' + articleUuidRegex + ')$', require('./utils/access'));
app.get('^/:id(' + articleUuidRegex + ')$', require('./controllers/article'));
app.get('^/:id(' + articleUuidRegex + ')/people', require('./controllers/related/people'));
app.get('^/:id(' + articleUuidRegex + ')/organisations', require('./controllers/related/organisations'));
app.get('^/:id(' + articleUuidRegex + ')/story-package', require('./controllers/related/story-package'));
app.get('^/:id(' + articleUuidRegex + ')/more-on', require('./controllers/related/more-on'));
app.get('^/:id(' + articleUuidRegex + ')/comments-hack', require('./controllers/comments-hack'));

app.get('/embedded-components/slideshow/:id', require('./controllers/slideshow'));
app.get('/__gtg', function(req, res) {
	res.status(200).end();
});

// Start the app
var port = process.env.PORT || 3001;
module.exports.listen = app.listen(port, function() {
	logger.info("Listening on " + port);
});
