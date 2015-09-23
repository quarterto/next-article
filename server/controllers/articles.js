'use strict';

var api = require('next-ft-api-client');
var fetchres = require('fetchres');
var NoRelatedResultsException = require('../lib/no-related-results-exception');

module.exports = function(req, res, next) {
	api.contentLegacy({
		uuid: req.body.ids,
		useElasticSearch: res.locals.flags.elasticSearchItemGet,
		type: 'Article'
	})
	.then(function(items) {
		res.format({
			'application/json': function() {
				res.send(items);
			},
			'application/text': function() {
				res.render('partials/related/suggested-reads', {items: items});
			}
		});
	})
	.catch(function(err) {
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
