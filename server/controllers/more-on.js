'use strict';

var ft = require('../utils/api').ft;
var Stream = require('../models/stream');
var cacheControl = require('../utils/cache-control');

module.exports = function(req, res, next) {
	ft
		.get([req.params.id])
		.then(function(article) {
			if (article[0] && article[0].packages && article[0].packages.length > 0) {
				article = article[0];
			} else {
				res.status(404).send();
				return;
			}

			return ft
				.get(article.packages)
				.then(function(articles) {
					if (articles.length > 0) {
						var stream = new Stream();
						articles
							// some articles may be undefined
							.filter(function (a) { return !!a; })
							.slice(0, req.query.count || undefined)
							.forEach(function(item) {
								stream.push('methode', item);
							});
						res.set(cacheControl);
						res.render('more-on' + (req.query.view ? '-' + req.query.view : ''), {
							mode: 'expand',
							stream: stream.texturedItems,
							title: 'See also'
						});
					} else {
						res.status(404).send();
					}
				});
		})
		.catch(next);
};
