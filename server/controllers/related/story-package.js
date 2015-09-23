'use strict';

var api = require('next-ft-api-client');
var fetchres = require('fetchres');
var cacheControl = require('../../utils/cache-control');
var NoRelatedResultsException = require('../../lib/no-related-results-exception');
var articlePodMapping = require('../../mappings/article-pod-mapping');

module.exports = function(req, res, next) {
	var isInline = req.query.view === 'inline';
	api.contentLegacy({
		uuid: req.params.id,
		useElasticSearch: res.locals.flags.elasticSearchItemGet
	})
		.then(function(article) {
			res.set(cacheControl);
			if (!article || !article.item || !article.item.package || article.item.package.length === 0) {
				throw new NoRelatedResultsException();
			}

			var packagePromises = article.item.package.map(function(item) {
				return api.contentLegacy({
						uuid: item.id,
						useElasticSearch: res.locals.flags.elasticSearchItemGet
					})
					.catch(function(err) {
						return null;
					});
			});
			return Promise.all(packagePromises);
		})
		.then(function(articles) {
			articles = articles.filter(function(article) {
				return article;
			});
			if (!articles.length) {
				throw new NoRelatedResultsException();
			}
			if (req.query.count) {
				articles.splice(req.query.count);
			}
			var imagePromises = articles.map(function(article) {
				return articlePodMapping(article);
			});
			return Promise.all(imagePromises);
		})
		.then(function(articles) {
			res.render('related/story-package', {
				articles: articles,
				headerText: 'Related stories',
				isInline: isInline
			});
		})
		.catch(function(err) {
			if(err.name === NoRelatedResultsException.NAME) {
				res.status(200).end();
			} else if (err instanceof fetchres.ReadTimeoutError) {
				res.status(500).end();
			} else if (fetchres.originatedError(err)) {
				res.status(404).end();
			} else {
				next(err);
			}
		});
};
