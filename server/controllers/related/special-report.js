'use strict';

var api = require('next-ft-api-client');
var fetchres = require('fetchres');
var NoRelatedResultsException = require('../../lib/no-related-results-exception');
var articlePodMapping = require('../../mappings/article-pod-mapping');


module.exports = function (req, res, next) {
	var parentArticleId = req.params.id;
	var specialReportId = req.query.specialReportId;
	var count = parseInt(req.query.count) || 5;

	var articleModelsPromise = api.searchLegacy({
			query: 'primarySectionId:"' + specialReportId + '"',
			count: (count) + 1,
			fields: true,
			useElasticSearch: res.locals.flags.elasticSearchItemGet
	})
	.then(function(specialReportArticlesES) {
		return specialReportArticlesES.map(function(specialReportArticleES) {
			return specialReportArticleES._source;
		})
			.filter(function(specialReportArticle) {
				return specialReportArticle.item.id !== parentArticleId;
			})
			.slice(0,count)
			.map(function(specialReportArticle) {
			return articlePodMapping(specialReportArticle);
			});
	})
	.catch(function(error) {
		return;
	});

	Promise.resolve(articleModelsPromise)
		.then(function(articles) {
			// pull out the specialReports tag
			var result = null;
			if (articles && articles.length) {
				var specialReport = articles[0].tag.specialReport;
				result = {
					name: specialReport.name,
					id: specialReport.id,
					image: articles[0].image,
					articles: articles
				};
			}
			res.render('related/special-report', {specialReport: result});
		})
		.catch(function (err) {
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
