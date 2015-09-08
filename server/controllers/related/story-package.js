'use strict';

var api = require('next-ft-api-client');
var fetchres = require('fetchres');
var cacheControl = require('../../utils/cache-control');
var extractUuid = require('../../utils/extract-uuid');
var NoRelatedResultsException = require('../../lib/no-related-results-exception');

module.exports = function(req, res, next) {
	var isInline = req.query.view === 'inline';
	api.contentLegacy({
		uuid: req.params.id,
		useElasticSearch: res.locals.flags.elasticSearchItemGet
	})
		.then(function(article) {
			res.set(cacheControl);
			if (!article || !article.item || !article.item.package || article.item.package.length === 0) {
				throw new NoRelatedResultsException();
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
			articles = articles.filter(function(article) {
				return article;
			});
			if (!articles.length) {
				throw new NoRelatedResultsException();
			}
			if (req.query.count) {
				articles.splice(req.query.count);
			}
			var imagePromises = articles.map(function(article) {
				var articleModel = {
					id: extractUuid(article.item.id),
					headline: article.item.title.title,
					subheading: article.item.summary ? article.item.summary.excerpt : '',
					lastUpdated: article.item.lifecycle.lastPublishDateTime
				};
				var primaryTheme = article.item.metadata.primaryTheme;
				if (primaryTheme) {
					articleModel.tag = primaryTheme.term;
				}
				if (!article.item.images) {
					return Promise.resolve(articleModel);
				}
				var images = {};
				article.item.images.forEach(function(img) {
					images[img.type] = img;
				});
				var image = images['wide-format'] || images.article || images.primary;
				if (image && !isInline) {
					articleModel.image = {
						url: image.url,
						alt: "",
						srcset: {
							s: 100,
							m: 200
						}
					};
				}
				return(articleModel);
			});
			return Promise.all(imagePromises);
		})
		.then(function(articles) {
			res.render('related/story-package', {
				articles: articles,
				headerText: 'Related stories',
				isInline: isInline
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
