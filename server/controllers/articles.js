'use strict';

var api = require('next-ft-api-client');

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
			default: function() {
				res.render('partials/related/suggested-reads', {items: items});
			}
		});
	})
	.catch(next);
};
