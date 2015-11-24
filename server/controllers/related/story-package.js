'use strict';

const api = require('next-ft-api-client');
const fetchres = require('fetchres');
const logger = require('ft-next-express').logger;
const NoRelatedResultsException = require('../../lib/no-related-results-exception');
const articlePodMapping = require('../../mappings/article-pod-mapping-v3');

module.exports = function(req, res, next) {

	if (!req.query.articleIds) {
		return res.status(400).end();
	}

	let count = parseInt(req.query.count, 10) || 5;

	return api.content({
		index: 'v3_api_v2',
		uuid: req.query.articleIds.split(',').slice(0, count)
	})
		.then(function(articles) {
			if (!articles.length) {
				throw new NoRelatedResultsException();
			}

			return articles.map(articlePodMapping);
		})
		.then(function(articles) {
			articles.forEach((article, i) => {
				if (article.mainImage && i > 0) {
					article.mainImage = null;
				}
			});

			return res.render('related/story-package', {
				articles: articles,
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
