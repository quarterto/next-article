'use strict';

var fetchSapiV1 = require('../utils/fetch-sapi-v1');
var fetchCapiV1 = require('../utils/fetch-capi-v1');
var fetchres = require('fetchres');
var cacheControl = require('../utils/cache-control');

module.exports = function(req, res, next) {
	fetchCapiV1({
		uuid: req.params.id,
		useElasticSearch: res.locals.flags.elasticSearchItemGet.isSwitchedOn
	})
		.then(function(article) {
			res.set(cacheControl);
			var topic = article.item.metadata[req.params.metadata];
			if (!topic) {
				res.status(404).end();
				return;
			}
			fetchSapiV1({
				query: topic.term.taxonomy + ':="' + topic.term.name + '"',
				count: 4
			})
				.then(function(results) {
					results = results.map(function(article) {
						return {
							id: article.id.replace('http://www.ft.com/thing/', ''),
							title: article.title,
							publishedDate: article.publishedDate
						};
					});
					res.render('more-on-v2', {
						title: topic.term.name,
						items: results
					});
				});
		})
		.catch(function(err) {
			if (err instanceof fetchres.BadServerResponseError) {
				res.status(404).end();
			} else {
				next(err);
			}
		});
};
