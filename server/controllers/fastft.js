'use strict';

var Stream = require('../models/stream');
var fastft = require('../utils/api').fastft;
var cacheControl = require('../utils/cache-control');

/*
	Takes data from the clamo api used by fastft and returns it in the required format
*/

module.exports = function(req, res, next) {
	fastft.getPost(req.params[0])
		.then(function(response) {
			var stream = new Stream();
			stream.push('fastft', response.post);
			res.set(cacheControl);
			res.render('layout', {
				layout: 'wrapper',
				mode: 'expand',
				isArticle: true,
				stream: { items: stream.items, meta: { facets: [] }}, // FIXME add facets back in, esult.meta.facets)
				isFollowable: true
			});

		})
		.catch(next);
};
