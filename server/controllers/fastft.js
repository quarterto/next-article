'use strict';

var cacheControl = require('../utils/cache-control');
var fetchres = require('fetchres');

module.exports = function(req, res, next) {
	var id = req.params[0];

	fetch('http://clamo.ftdata.co.uk/api?' + encodeURI('request=[{"action":"getPost","arguments":{"id":' + id + '}}]'), {
		timeout: 3000
	})
		.then(fetchres.json)
		.then(function(response) {
			if (response[0].status === 'ok') {
				res.set(cacheControl);
				res.redirect('/' + response[0].data.uuidv3);
			} else {
				console.error('FastFT: failed getting "%s" with message "%s"', id, response[0].title);
				res.status(404).end();
			}
		})
		.catch(next);
};
