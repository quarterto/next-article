'use strict';

const api = require('next-ft-api-client');
const fetchres = require('fetchres');
const logger = require('ft-next-express').logger;
const NoRelatedResultsException = require('../../lib/no-related-results-exception');
const articlePodMapping = require('../../mappings/article-pod-mapping-v3');

function getArticles (tagId, count, parentId) {
	return api.search({
		filter: [ 'metadata.idV1', tagId ],
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
			return articles
				.filter(article => article.id !== parentId)
				.slice(0, count)
				.map(articlePodMapping);
		});
}

module.exports = function(req, res, next) {

	if (!req.query.tagId) {
		return res.status(400).end();
	}

	const tagId = req.query.tagId;
	const count = parseInt(req.query.count, 10) || 5;
	const parentId = req.params.id;

	return getArticles(tagId, count, parentId)
		.then(specialReportArticles => {
			let articleWithImage = specialReportArticles.find(article => article.mainImage);
			return res.render('related/special-report', {
				id: specialReportArticles[0].primaryTag.idV1,
				name: specialReportArticles[0].primaryTag.prefLabel,
				image: articleWithImage ? articleWithImage.mainImage : null,
				articles: specialReportArticles
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
