/*jshint node:true*/
'use strict';

var ft = require('../utils/api').ft;
var Metrics = require('next-metrics');
var Stream = require('../models/stream');
var cacheControl = require('../utils/cache-control');


module.exports = function(req, res, next) {

	Metrics.instrument(res, { as: 'express.http.res' });

	ft
		.get([req.params.id])
		.then(function (article) {
			if (article[0] && article[0].packages && article[0].packages.length > 0) {
				article = article[0];
			} else {
				res.status(404).send();
				return;
			}

			return ft
				.get(article.packages)
				.then(function (articles) {
					if (articles.length > 0) {

						var stream = new Stream();

						articles.forEach(function(item) {
							stream.push('methode', item);
						});
						res.set(cacheControl);
						res.render('components/more-on', {
							mode: 'expand',
							stream: stream.items,
							title: 'Related to this story'
						});
					} else {
						res.status(404).send();
					}
				}, function (err) {
					console.log(err);
					res.send(404);
				});
		})
		.catch(next);
};
