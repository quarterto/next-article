'use strict';

var fetchCapiV1 = require('../utils/fetch-capi-v1');
var fetchMapping = require('../utils/fetch-mapping');

module.exports = function(req, res, next) {
	var taxonomy = req.params.taxonomy;

	fetchCapiV1({ uuid: req.params.id })
		.then(function (article) {
			var promises = article.item.metadata[taxonomy].map(function (item) {
				return fetchMapping(item.term.id, taxonomy)
					.catch(function(err) {
						if (err instanceof fetchres.BadServerResponseError) {
							res.status(404).end();
						} else {
							next(err);
						}
					});
			});
			Promise.all(promises)
				.then(function (results) {
					var items = results.map(function (result) {
						return result.enriched_goodness;
					}).filter(function (item) {
						return item;
					}).map(function (item) {
						return {
							name: item.labels[0],
							profile: item.profile.replace(/\\n\\n/g, '</p><p>')
						}
					});
					res.render('related-' + taxonomy, {
						items: items
					});
				})

		})
		.catch(function (err) {
			console.log(err);
		});
};
