'use strict';

var api = require('next-ft-api-client');
var fetchres = require('fetchres');

module.exports = function (req, res, next) {
	api.contentLegacy({
		uuid: req.params.id,
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
				return result;
			});
			return api.contentLegacy({
				uuid: ids,
				useElasticSearch: res.locals.flags.elasticSearchItemGet,
				type: 'Article'
			});
		})
		.then(function (results) {
			if (!results.length) {
				throw new Error('No special report articles');
			}
			var articles = results.map(function (result) {
				return result.item;
			});
			// get the best image from the
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
				articles: articles,
			});
		})
		.catch(function (err) {
			if (err.message === 'No special report') {
				res.status(200).end();
			} else if (err instanceof fetchres.ReadTimeoutError) {
				res.status(500).end();
			} else if (err instanceof fetchres.BadServerResponseError) {
				res.status(404).end();
			} else {
				next(err);
			}
		});
};
