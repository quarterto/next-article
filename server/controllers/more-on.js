'use strict';

var fetchCapiV1 = require('../utils/fetch-capi-v1');
var fetchCapiV2 = require('../utils/fetch-capi-v2');
var cacheControl = require('../utils/cache-control');
var fetchres = require('fetchres');

module.exports = function(req, res, next) {
	fetchCapiV1({
		uuid: req.params.id,
		useElasticSearch: res.locals.flags.elasticSearchItemGet.isSwitchedOn
	})
		.then(function(article) {
			res.set(cacheControl);
			if (!article || !article.item || !article.item.package || article.item.package.length === 0) {
				res.status(404).send();
				return;
			}

			var packagePromises = article.item.package.map(function(item) {
				return fetchCapiV2({ uuid: item.id })
					.catch(function(err) {
						if (err instanceof fetchres.BadServerResponseError) {
							return undefined;
						} else {
							throw err;
						}
					});
			});

			return Promise.all(packagePromises)
				.then(function(results) {
					var articles = results.filter(function(article) {
						return article;
					});
					if (articles.length === 0) {
						res.status(404).send();
						return;
					}
					if (req.query.count) {
						articles.splice(req.query.count);
					}
					articles = articles.map(function(article) {
						return {
							id: article.id.replace('http://www.ft.com/thing/', ''),
							title: article.title,
							publishedDate: article.publishedDate
						};
					});
					res.render('more-on', {
						articles: articles,
						isInline: req.query.view === 'inline'
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
