'use strict';

var api = require('next-ft-api-client');
var fetchres = require('fetchres');
var logger = require('ft-next-express').logger;
var cacheControl = require('../../utils/cache-control');
var NoRelatedResultsException = require('../../lib/no-related-results-exception');
var articlePodMapping = require('../../mappings/article-pod-mapping');

module.exports = function (req, res, next) {
	var parentArticleId = req.params.id;
	var moreOnTaxonomy = req.query.moreOnTaxonomy;
	var moreOnId = req.query.moreOnId;
	var count = parseInt(req.query.count) || 5;

	var articleModelsPromise = api.searchLegacy({
		query: moreOnTaxonomy + 'Id:"' + moreOnId + '"',
		// get plus one, in case we dedupe
		count: (count) + 1,
		fields: true,
		useElasticSearch: res.locals.flags.elasticSearchItemGet
	})
	.then(function(topicArticlesES) {
		return topicArticlesES.map(function(topicArticleES) {
			return topicArticleES._source;
		})
			.filter(function(topicArticle) {
				return topicArticle.item.id !== parentArticleId;
			})
			.slice(0,count)
			.map(function(topicArticle) {
			return articlePodMapping(topicArticle);
			});
	})
	.catch(function(error) {
		return ;
	});

	Promise.resolve(articleModelsPromise)
		.then(function(articleModels) {
			var moreOns;
			articleModels && articleModels.length ? moreOns = {
				articles: articleModels.map(function (articleViewModel, index) {
					if (index !== 0 && index !== 5 && articleViewModel.image) {
						delete articleViewModel.image;
					}
					return articleViewModel;
				})
			} : moreOns = null;

			res.render('related/more-on', {
				moreOns: moreOns
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
