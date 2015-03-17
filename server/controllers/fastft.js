'use strict';

var cacheControl = require('../utils/cache-control');
var fetchres = require('fetchres');

module.exports = function(req, res, next) {
	fetch('http://clamo.ftdata.co.uk/api?' + encodeURI('request=[{"action":"getPost","arguments":{"id":' + req.params[0] + '}}]'), {
		timeout: 3000
	})
		.then(fetchres.json)
		.then(function(response) {
			res.set(cacheControl);
			res.redirect('/' + response[0].data.uuidv3);
		})
		.catch(next);
};
