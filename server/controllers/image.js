'use strict';

var fetchres = require('fetchres');
var fetchCapiV2 = require('../utils/fetch-capi-v2');

module.exports = function(req, res, next) {
	fetchCapiV2({ uuid: req.params.id })
		.then(function(image) {
			if (image.type === 'http://www.ft.com/ontology/content/ImageSet') {
				return fetchCapiV2({ uuid: image.members[0].id.replace('http://api.ft.com/content/', '') })
					.then(function(image) {
						res.redirect(image.binaryUrl);
					});
			}
			res.status(404).end();
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
