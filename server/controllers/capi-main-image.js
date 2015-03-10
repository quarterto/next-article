'use strict';
var fetchres = require('fetchres');
var cacheControl = require('../utils/cache-control');

module.exports = function(req, res, next) {
	fetch('http://api.ft.com/content/items/v1/' + req.params[0], {
		timeout: 3000,
		headers: {
			'X-Api-Key': process.env.apikey
		}
	})
		.then(fetchres.json)
		.then(function(article) {
			res.set(cacheControl);
			var images = article.item.images.filter(function(image) {
					return image.type === 'wide-format';
				});
			if (images.length === 0) {
				res.status(404).end();
			} else {
				res.redirect(images[0].url);
			}
		})
		.catch(function(err) {
			if (err instanceof fetchres.BadServerResponseError) {
				res.status(404).end();
			} else {
				next(err);
			}
		});
};
