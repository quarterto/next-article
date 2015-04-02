'use strict';

var fetchres = require('fetchres');
var api = require('next-ft-api-client');
var cacheControl = require('../utils/cache-control');
var resize = require('../utils/resize');

var extractUuid = function (uri) {
	return uri.replace(/http:\/\/(?:api|www).ft.com\/[^\/]+\/(.*)/, '$1');
};

module.exports = function (req, res, next) {
	var topic;

	api.contentLegacy({
		uuid: req.params.id,
		useElasticSearch: res.locals.flags.elasticSearchItemGet.isSwitchedOn
	})
		.then(function (article) {
			res.set(cacheControl);
			topic = article.item.metadata[req.params.metadata];
			// if it's an array, use the first
			if (Array.isArray(topic)) {
				topic = topic.shift();
			}
			if (!topic) {
				throw new fetchres.BadServerResponseError();
			}
			return api.searchLegacy({
				query: topic.term.taxonomy + ':="' + topic.term.name + '"',
				count: req.query.count || 4
			});
		})
		.then(function (results) {
			if (!results.length) {
				throw new fetchres.BadServerResponseError();
			}
			var articleModels = results.map(function (result) {
				return {
					id: extractUuid(result.id),
					title: result.title,
					publishedDate: result.publishedDate
				};
			});
			// get the first article's main image, if it exists
			if (!results[0].mainImage) {
				return Promise.resolve(articleModels);
			}
			return api.content({
					uuid: extractUuid(results[0].mainImage.id),
					type: 'ImageSet'
				})
				.then(function (imageSet) {
					articleModels[0].image = resize(
						'http://com.ft.imagepublish.prod.s3.amazonaws.com/' + extractUuid(imageSet.members[0].id),
						{ width: 447 }
					);
					return articleModels;
				})
				// don't fail if can't get image
				.catch(function (err) {
					return articleModels;
				});
		})
		.then(function (articleModels) {
			res.render('more-on-topic', {
				title: {
					label: topic.term.name,
					name: topic.term.name,
					taxonomy: topic.term.taxonomy
				},
				articles: articleModels
			});
		})
		.catch(function (err) {
			if (err instanceof fetchres.BadServerResponseError) {
				res.status(404).end();
			} else {
				next(err);
			}
		});
};
