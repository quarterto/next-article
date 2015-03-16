'use strict';

var fetchres = require('fetchres');
var fetchCapiV2 = require('../utils/fetch-capi-v2');

module.exports = function(req, res, next) {
	fetchCapiV2(req.params.id)
		.then(fetchres.json)
		.then(function(image) {
			return fetch(image.members[0].id.replace('http://api.ft.com/content/', ''), {
					timeout: 3000,
					headers: {
						'X-Api-Key': process.env.api2key
					}
				})
				.then(fetchres.json);
		})
		.then(function(image) {
			res.redirect(image.binaryUrl);
		})
		.catch(function(err) {
			if (err instanceof fetchres.BadServerResponseError) {
				res.status(404).end();
			} else {
				throw err;
			}
		})
		.catch(next);
};
