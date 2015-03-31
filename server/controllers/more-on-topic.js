'use strict';

var api = require('next-ft-api-client');
var fetchres = require('fetchres');
var cacheControl = require('../utils/cache-control');

module.exports = function(req, res, next) {
	api.contentLegacy({
		uuid: req.params.id,
		useElasticSearch: res.locals.flags.elasticSearchItemGet.isSwitchedOn
	})
		.then(function(article) {
			res.set(cacheControl);
			var topic = article.item.metadata[req.params.metadata];
			// if it's an array, use the first
			if (Array.isArray(topic)) {
				topic = topic.shift();
			}
			if (!topic) {
				res.status(404).end();
				return;
			}
			api.searchLegacy({
				query: topic.term.taxonomy + ':="' + topic.term.name + '"',
				count: req.query.count || 4
			})
				.then(function(results) {
					results = results.map(function(article) {
						return {
							id: article.id.replace('http://www.ft.com/thing/', ''),
							title: article.title,
							publishedDate: article.publishedDate
						};
					});
					res.render('more-on-topic', {
						title: {
							label: topic.term.name,
							name: topic.term.name,
							taxonomy: topic.term.taxonomy
						},
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
