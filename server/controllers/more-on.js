'use strict';

var fetchres = require('fetchres');
var api = require('next-ft-api-client');
var cacheControl = require('../utils/cache-control');
var resize = require('../utils/resize');

var extractUuid = function (uri) {
	return uri.replace(/http:\/\/(?:api|www).ft.com\/[^\/]+\/(.*)/, '$1');
};

module.exports = function (req, res, next) {
	api.contentLegacy({
		uuid: req.params.id,
		useElasticSearch: res.locals.flags.elasticSearchItemGet
	})
		.then(function (article) {
			res.set(cacheControl);
			if (!article || !article.item || !article.item.package || article.item.package.length === 0) {
				throw new Error('No related');
			}

			var packagePromises = article.item.package.map(function (item) {
				return api.content({ uuid: item.id, type: 'Article' })
					.catch(function (err) {
						return null;
					});
			});
			return Promise.all(packagePromises);
		})
		.then(function (results) {
			var articles = results.filter(function (article) {
				return article;
			});
			if (!articles.length) {
				throw new Error('No related');
			}
			if (req.query.count) {
				articles.splice(req.query.count);
			}
			var imagePromises = articles.map(function (article) {
				var articleModel = {
					id: extractUuid(article.id),
					title: article.title,
					publishedDate: article.publishedDate
				};
				if (!article.mainImage) {
					return Promise.resolve(articleModel);
				}
				// get the main image
				return api.content({
						uuid: extractUuid(article.mainImage.id),
						type: 'ImageSet'
					})
					.then(function (imageSet) {
						articleModel.image = resize(
							'http://com.ft.imagepublish.prod.s3.amazonaws.com/' + extractUuid(imageSet.members[0].id),
							{ width: 100 }
						);
						return articleModel;
					})
					// don't fail if can't get image
					.catch(function (err) {
						return articleModel;
					});
			});
			return Promise.all(imagePromises);
		})
		.then(function (articles) {
			res.render('more-on', {
				articles: articles,
				isInline: req.query.view === 'inline'
			});
		})
		.catch(function (err) {
			if (err.message === 'No related') {
				res.status(200).end();
			} else if (err instanceof fetchres.BadServerResponseError) {
				res.status(404).end();
			} else {
				next(err);
			}
		});
};
