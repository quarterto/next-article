'use strict';

const api = require('next-ft-api-client');
const fetchres = require('fetchres');
const logger = require('ft-next-express').logger;
const NoRelatedResultsException = require('../../lib/no-related-results-exception');
const articlePodMapping = require('../../mappings/article-pod-mapping');

module.exports = function(req, res, next) {
	let storyPackageIds = req.query.ids;

	if (!req.query.ids) {
		return res.status(400).end();
	}

	return api.contentLegacy({
		uuid: storyPackageIds.split(','),
		useElasticSearch: true,
		useElasticSearchOnAws: res.locals.flags.elasticSearchOnAws
	})
		.then(function(articles) {
			if (!articles.length) {
				throw new NoRelatedResultsException();
			}
			if (req.query.count) {
				articles.splice(req.query.count);
			}

			return articles.map(function(article) {
				return articlePodMapping(article);
			});
		})
		.then(function(articles) {
			let numImages = 0;
			articles.map( article => article.image && numImages ++);
			let imageCount = 0;
			return res.render('related/story-package', {
				articles: articles.map(function(article) {
					article.image && imageCount ++;
					if (articles.length === 5 && numImages === 5 && (imageCount === 3 || imageCount === 4)) {
						article.image = undefined;
					}
					if (articles.length === 3 && numImages > 1 && article.image && (imageCount === 2 || imageCount === 3)) {
						article.image = undefined;
					}
					return article;
				}),
				headerText: 'Related stories',
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
