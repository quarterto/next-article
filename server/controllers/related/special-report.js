'use strict';

var api = require('next-ft-api-client');
var fetchres = require('fetchres');
var logger = require('ft-next-express').logger;
var NoRelatedResultsException = require('../../lib/no-related-results-exception');
var articlePodMapping = require('../../mappings/article-pod-mapping');

module.exports = function (req, res, next) {
	var parentArticleId = req.params.id;
	var specialReportId = req.query.specialReportId;
	var count = parseInt(req.query.count, 10) || 5;

	return api.searchLegacy({
		query: 'primarySectionId:"' + specialReportId + '"',
		count: count,
		// HACK: Always use ES for more ons so we can get the document directly
		fields: true,
		useElasticSearch: true
	})
		.then(function(specialReportArticlesES) {

			var articles = specialReportArticlesES
				.filter(topicArticle => topicArticle._id !== parentArticleId)
				.map(topicArticle => articlePodMapping(topicArticle._source))
				.slice(0, count);

			// pull out the specialReports tag
			var specialReport = articles[0].tag.specialReport;

			return res.render('related/special-report', {
				id: specialReport && specialReport.id,
				name: specialReport && specialReport.name,
				image: articles[0].image,
				articles: articles
			});
		})
		.catch(function (err) {
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
