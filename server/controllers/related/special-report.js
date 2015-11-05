'use strict';

const api = require('next-ft-api-client');
const fetchres = require('fetchres');
const logger = require('ft-next-express').logger;
const NoRelatedResultsException = require('../../lib/no-related-results-exception');
const articlePodMapping = require('../../mappings/article-pod-mapping-v3');

module.exports = function(req, res, next) {

	if (!req.query.specialReportId) {
		return res.status(400).end();
	}

	let count = parseInt(req.query.count, 10) || 5;

	return api.search({
		filter: [ 'metadata.idV1', req.query.specialReportId ],
		// Get +1 for de-duping
		count: count + 1,
		fields: [
			'id',
			'title',
			'metadata',
			'summaries',
			'mainImage',
			'publishedDate'
		]
	})
		.then(function(articles) {
			if (!articles.length) {
				throw new NoRelatedResultsException();
			}

			articles = articles
				.filter(article => article.id !== req.param.id)
				.slice(0, count)
				.map(articlePodMapping);

			let articleWithImage = articles.find(article => new Boolean(article.mainImage));

			return res.render('related/special-report', {
				id: articles[0].primaryTag.idV1,
				name: articles[0].primaryTag.prefLabel,
				image: articleWithImage ? articleWithImage.mainImage : null,
				articles: articles
			});
		})
		.catch(function(err) {
			logger.error(err);

			if (err.name === NoRelatedResultsException.NAME) {
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
