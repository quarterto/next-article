'use strict';

const api = require('next-ft-api-client');
const fetchres = require('fetchres');
const logger = require('ft-next-express').logger;
const NoRelatedResultsException = require('../../lib/no-related-results-exception');
const articlePodMapping = require('../../mappings/article-pod-mapping-v3');

module.exports = function(req, res, next) {

	if (!req.query.ids) {
		return res.status(400).end();
	}

	return api.content({
		index: 'v3_api_v2',
		uuid: req.query.ids.split(',').slice(0, req.query.count || 5)
	})
		.then(function(articles) {
			if (!articles.length) {
				throw new NoRelatedResultsException();
			}

			return articles.map(articlePodMapping);
		})
		.then(function(articles) {
			let numImages = 0;
			let imageCount = 0;

			articles.forEach(article => article.image && numImages++);

			return res.render('related/story-package', {
				articles: articles.map(article => {
					article.image && imageCount ++;

					if (articles.length === 5 && numImages === 5 && (imageCount === 3 || imageCount === 4)) {
						article.image = null;
					}

					if (articles.length === 3 && numImages > 1 && article.image && (imageCount === 2 || imageCount === 3)) {
						article.image = null;
					}

					return article;
				}),
				headerText: 'Related stories'
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
