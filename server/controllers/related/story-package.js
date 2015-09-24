'use strict';

var api = require('next-ft-api-client');
var fetchres = require('fetchres');
var NoRelatedResultsException = require('../../lib/no-related-results-exception');
var articlePodMapping = require('../../mappings/article-pod-mapping');

module.exports = function(req, res, next) {
	var isInline = req.query.view === 'inline';
	var storyPackageIds = req.query.ids.split(',');
	api.contentLegacy({
		uuid: storyPackageIds,
		useElasticSearch: res.locals.flags.elasticSearchItemGet
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
