'use strict';

var ft = require('../utils/api').ft;

module.exports = function(req, res, next) {
	ft
		.get([req.params.id])
		.then(function (article) {
			if (article && article.length) {
				article = article[0];
			} else {
				res.status(404).send();
				return;
			}

			return ft
				.get(article.packages.slice(0,1))
				.then(function (articles) {
					if (articles.length > 0) {
					require('../utils/cache-control')(res);
					res.render('components/more-on', {
						mode: 'expand',
						stream: articles,
						title: 'Related to this story'
					});
					} else {
						res.status(404).send();
					}
				});
		})
		.catch(next);
};
