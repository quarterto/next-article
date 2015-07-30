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
					query: {
						match: {
							"item.metadata.primarySection.term.id": specialReportId
						}
					},
					count: 5,
					fields: ['_source'],
					useElasticSearch: res.locals.flags.elasticSearchItemGet
				})
				.then(function (results) {
					if (!results) {
						throw new Error('No special report');
					}
					var specialReport = article.item.metadata.primarySection.term;
					var articles = results.map(function (result) {
						return result._source.item;
					});
					// get the best image
					var images = {};
					article.item.images.forEach(function (image) {
						images[image.type] = image;
					});
					res.render('related/special-report', {
						name: specialReport.name,
						id: specialReport.id,
						image: images['wide-format'] || images.article || images.primary,
						articles: articles,
					});
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
