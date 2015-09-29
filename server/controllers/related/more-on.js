'use strict';

var api = require('next-ft-api-client');
var fetchres = require('fetchres');
var logger = require('ft-next-express').logger;
var NoRelatedResultsException = require('../../lib/no-related-results-exception');
var articlePodMapping = require('../../mappings/article-pod-mapping');

module.exports = function (req, res, next) {
	var parentArticleId = req.params.id;
	var moreOnTaxonomy = req.query.moreOnTaxonomy;
	var moreOnId = req.query.moreOnId;
	var count = parseInt(req.query.count, 10) || 5;

	return api.searchLegacy({
		query: moreOnTaxonomy + 'Id:"' + moreOnId + '"',
		// get plus one, in case we dedupe
		count: count + 1,
		// HACK: Always use ES for more ons so we can get the document directly
		fields: true,
		useElasticSearch: true
	})
		.then(function(topicArticlesES) {

			var articles = topicArticlesES
				.filter(topicArticle => topicArticle._id !== parentArticleId)
				.map(topicArticle => articlePodMapping(topicArticle._source))
				.slice(0, count);

			return res.render('related/more-on', {
				articles: articles.map(function(article, index) {
					if (article.image && index && index !== 5) {
						article.image = undefined;
					}

					return article;
				})
			});
		})
		.catch(function(err) {
			logger.error(err);

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
