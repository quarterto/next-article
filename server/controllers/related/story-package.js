'use strict';

var fetchres = require('fetchres');
var api = require('next-ft-api-client');
var cacheControl = require('../../utils/cache-control');
var extractUuid = require('../../utils/extract-uuid');
var getVisualCategory = require('ft-next-article-genre');

module.exports = function(req, res, next) {
	api.contentLegacy({
		uuid: req.params.id,
		useElasticSearch: res.locals.flags.elasticSearchItemGet
	})
		.then(function(article) {
			res.set(cacheControl);
			if (!article || !article.item || !article.item.package || article.item.package.length === 0) {
				throw new Error('No related');
			}

			var packagePromises = article.item.package.map(function(item) {
				return api.contentLegacy({
					uuid: item.id,
					useElasticSearch: res.locals.flags.elasticSearchItemGet
				})
					.catch(function(err) {
						return null;
					});
			});
			return Promise.all(packagePromises);
		})
		.then(function(articles) {
			if (!articles.length) {
				throw new Error('No related');
			}
			if (req.query.count) {
				articles.splice(req.query.count);
			}
			var imagePromises = articles.map(function(article) {
				var articleModel = {
					id: extractUuid(article.item.id),
					headline: article.item.title.title,
					lastUpdated: article.item.lifecycle.lastPublishDateTime,
					visualCategory: getVisualCategory(article.item.metadata),
					isBlock: true
				};
				if (!article.item.images) {
					return Promise.resolve(articleModel);
				}
				var images = {};
				article.item.images.forEach(function(img) {
					images[img.type] = img;
				});
				articleModel.image = images['wide-format'] || images.article || images.primary;
				if (articleModel.image) {
					articleModel.image.srcset = {
						default: 100
					};
					articleModel.image.class = 'story-package__image';
				}
				return(articleModel);
			});
			return Promise.all(imagePromises);
		})
		.then(function(articles) {
			res.render('related/story-package', {
				articles: articles,
				isInline: req.query.view === 'inline'
			});
		})
		.catch(function(err) {
			if (err.message === 'No related') {
				res.status(200).end();
			} else if (err instanceof fetchres.ReadTimeoutError) {
				res.status(500).end();
			} else if (err instanceof fetchres.BadServerResponseError) {
				res.status(404).end();
			} else {
				next(err);
			}
		});
};
