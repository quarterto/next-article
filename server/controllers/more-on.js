'use strict';

var fetchCapiV1 = require('../utils/fetch-capi-v1');
var fetchCapiV2 = require('../utils/fetch-capi-v2');
var cacheControl = require('../utils/cache-control');
var fetchres = require('fetchres');

module.exports = function(req, res, next) {
	fetchCapiV1({ uuid: req.params.id })
		.then(function(article) {
			res.set(cacheControl);
			if (!article || !article.item || !article.item.package || article.item.package.length === 0) {
				res.status(404).send();
				return;
			}
			var moreOns = article.item.package;

			return Promise.all(moreOns.map(function(moreOn) {
					return fetchCapiV2({ uuid: moreOn.id })
						.catch(function(err) {
							if (err instanceof fetchres.BadServerResponseError) {
								return undefined;
							} else {
								throw err;
							}
						});
				}))
				.then(function(results) {
					var mode = req.query.view === 'inline' ? 'more-on-inline' : 'more-on-v2';
					results = results.filter(function(article) {
						return article;
					});
					if (req.query.count) {
						results.splice(req.query.count);
					}
					results = results
						.map(function(article) {
							return {
								id: article.id.replace('http://www.ft.com/thing/', ''),
								title: article.title,
								publishedDate: article.publishedDate
							};
						});

					res.render(mode, {
						title: 'See also',
						items: results
					});
				});
		})
		.catch(function(err) {
			if (err instanceof fetchres.BadServerResponseError) {
				res.status(404).end();
			} else {
				next(err);
			}
		});
};
