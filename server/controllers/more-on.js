'use strict';

var ft = require('../utils/api').ft;
var Metrics = require('next-metrics');
var Stream = require('../models/stream');

module.exports = function(req, res, next) {
    
    Metrics.instrument(res, { as: 'express.http.res' });
	
	var stream = new Stream()
    ft
		.get([req.params.id])
		.then(function (article) {
			if (article[0]) {
				article = article[0];
			} else {
				res.status(404).send();
				return;
			}

			return ft
				.get(article.packages)
				.then(function (articles) {
					if (articles.length > 0) {
						articles.forEach(function(item) {
							stream.push('methode', item);
						});
						require('../utils/cache-control')(res);
						res.render('components/more-on', {
							mode: 'expand',
							stream: stream.items,
							title: 'Related to this story'
						});
					} else {
						res.status(404).send();
					}
				});
		})
		.catch(next);
};
