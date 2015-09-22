'use strict';

var api = require('next-ft-api-client');
var fetchres = require('fetchres');
var NoRelatedResultsException = require('../../lib/no-related-results-exception');


module.exports = function (req, res, next) {
	var articleId = req.params.id;
	api.contentLegacy({
		uuid: articleId,
		useElasticSearch: res.locals.flags.elasticSearchItemGet
	})
		.then(function (article) {
			if (article.item.metadata.primarySection.term.taxonomy !== 'specialReports') {
				return res.status(200).end();
			}
			// get the articles in this special report
			var specialReportId = article.item.metadata.primarySection.term.id;
			return api.searchLegacy({
				query: 'primarySectionId:"' + specialReportId + '"',
				count: 5,
				useElasticSearch: res.locals.flags.elasticSearchItemGet
			});
		})
		.then(function (results) {
			var ids = results.filter(function (result) {
				return result && result !== articleId;
			});
			return api.contentLegacy({
				uuid: ids,
				useElasticSearch: res.locals.flags.elasticSearchItemGet,
				type: 'Article'
			});
		})
		.then(function (results) {
			if (!results.length) {
				throw new NoRelatedResultsException();
			}
			var articles = results.map(function (result) {
				return result.item;
			});
			// get the best image
			var images = {};
			articles[0].images.forEach(function (image) {
				images[image.type] = image;
			});
			// pull out the specialReports tag
			var specialReport = articles[0].metadata.primarySection.term;
			res.render('related/special-report', {
				name: specialReport.name,
				id: specialReport.id,
				image: images['wide-format'] || images.article || images.primary,
				articles: articles
			});
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
