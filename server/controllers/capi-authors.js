'use strict';
var fetchres = require('fetchres');
var cacheControl = require('../utils/cache-control');
var fetchCapiV1 = require('../utils/fetch-capi-v1');

module.exports = function(req, res, next) {
	fetchCapiV1({
		uuid: req.params[0],
		useElasticSearch: res.locals.flags.elasticSearchItemGet
	})
		.then(fetchres.json)
		.then(function(article) {
			res.set(cacheControl);
			res.json(article.item.metadata.authors.map(function(author) {
				return author.term.name;
			}));
		})
		.catch(function(err) {
			if (err instanceof fetchres.BadServerResponseError) {
				res.status(404).end();
			} else {
				next(err);
			}
		});
};
