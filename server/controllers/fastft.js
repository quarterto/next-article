'use strict';

var fetchres = require('fetchres');
var errorsHandler = require('express-errors-handler');
var cacheControl = require('../utils/cache-control');

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
				errorsHandler.captureMessage('Failed getting "' + id + '" with message "' + response[0].title + '"', {
					tags: {
						service: 'fastft',
						status: response.status
					}
				})
				res.status(404).end();
			}
		})
		.catch(next);
};
