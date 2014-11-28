'use strict';

var Metrics = require('next-metrics');
var ft = require('../utils/api').ft;
var Stream = require('../models/stream');

var titleMapping = {
	'primarySection': 'section',
	'primaryTheme': 'theme'
};

module.exports = function(req, res, next) {
    
    Metrics.instrument(res, { as: 'express.http.res' });

    ft.get([req.params.id])
		.then(function(thisArticle) {
			var topic, query, topicTitle = titleMapping[req.params.metadata];
			if (thisArticle && thisArticle.length) {
				thisArticle = thisArticle[0];
			} else {
				res.status(404).send();
				return;
			}
			topic = thisArticle[req.params.metadata];
			if (!topic) {
				res.status(404).send();
				return;
			}

			query = topic.taxonomy + ':' + topic.name;

			return ft.search(query, 4)
				.then(function (results) {
					var ids;
					var articles = results ? results.articles : [];
					if (articles[0] instanceof Object) {
						return articles.map(function (article) {
							return article.id;
						});
					}
					return [];
				})
				.then(function(ids) {
					return ft.get(ids);
				})
				.then(function (articles) {
					var stream = new Stream();

					articles = articles.filter(function(article) {
						return article.id !== thisArticle.id;
					});

					articles.forEach(function(item) {
						stream.push('methode', item);
					});

					if (articles.length > 0) {
						require('../utils/cache-control')(res);
						res.render('components/more-on', {
							mode: 'expand',
							stream: stream.items,
							query: query,
							title: 'More from this ' + topicTitle + ' - ' + topic.name
						});
					} else {
						res.status(404).send();
					}
				});
		})
		.catch(next);
};
