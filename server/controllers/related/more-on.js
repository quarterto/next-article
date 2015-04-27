'use strict';

var fetchres = require('fetchres');
var api = require('next-ft-api-client');
var cacheControl = require('../../utils/cache-control');
var resize = require('../../utils/resize');
var extractUuid = require('../../utils/extract-uuid');

function hasSemanticStream(taxonomy) {
	return ['people', 'organisations'].indexOf(taxonomy) > -1;
}

module.exports = function (req, res, next) {
	var metadataFields = req.query['metadata-fields'].split(',');
	var count = parseInt(req.query.count) || 5;

	api.contentLegacy({
		uuid: req.params.id,
		useElasticSearch: res.locals.flags.elasticSearchItemGet
	})
		.then(function (article) {
			res.set(cacheControl);
			var moreOnPromises = metadataFields
				.map(function (metadataField) {
					var topic = article.item.metadata[metadataField];
					// if it's an array, use the first
					if (Array.isArray(topic)) {
						topic = topic.shift();
					}
					if (!topic) {
						return null;
					}
					var promises = [];
					promises.push(api.searchLegacy({
						query: topic.term.taxonomy + ':="' + topic.term.name + '"',
						// get one extra, in case we dedupe
						count: count + 1
					}));
					promises.push(Promise.resolve(topic));
					if (res.locals.flags.semanticStreams && hasSemanticStream(topic.term.taxonomy)) {
						promises.push(
							api.mapping(topic.term.id, topic.term.taxonomy)
								.then(function (v2Topic) {
									return extractUuid(v2Topic.id);
								})
								.catch(function (err) {})
						);
					}
					return Promise.all(promises);
				})
				.filter(function (promise) {
					return promise;
				});

			if (!moreOnPromises.length) {
				throw new Error('No related');
			}

			return Promise.all(moreOnPromises);
		})
		.then(function (results) {
			var imagePromises = results
				.map(function (result) {
					var articles = result[0];
					var topic = result[1];
					var articleModels = articles
						.filter(function (article) {
							return extractUuid(article.id) !== req.params.id;
						})
						.slice(0, count)
						.map(function (article) {
							return {
								id: extractUuid(article.id),
								title: article.title,
								mainImage: article.mainImage && article.mainImage.id,
								publishedDate: article.publishedDate
							};
						});
					if (!articleModels.length) {
						throw null;
					}
					var promises = [];
					// get the first article's main image, if it exists (and not author's stories)
					if (!res.locals.flags.moreOnImages || !articleModels[0].mainImage || topic.taxonomy === 'authors') {
						promises.push(Promise.resolve(articleModels));
					} else {
						promises.push(api.content({
								uuid: extractUuid(articleModels[0].mainImage),
								type: 'ImageSet',
								useElasticSearch: res.locals.flags.elasticSearchItemGet
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
							})
						);
					}
					promises.push(Promise.resolve(topic));
					promises.push(Promise.resolve(result[2]));
					return Promise.all(promises);
				})
				.filter(function (promise) {
					return promise;
				});

			if (!imagePromises.length) {
				throw new Error('No related');
			}

			return Promise.all(imagePromises);
		})
		.then(function (results) {
			var moreOns = results
				.map(function (result) {
					var articleModels = result[0];
					var topic = result[1];
					var topicV2Uuid = result[2];
					var topicModel = {
						name: topic.term.name,
						taxonomy: topic.term.taxonomy
					};
					topicModel.url = topicV2Uuid ?
						topicModel.taxonomy + '/' + topicV2Uuid :
						'/stream/' + encodeURIComponent(topicModel.taxonomy) + '/' + encodeURIComponent(topicModel.name);
					topicModel.isAuthor = topicModel.taxonomy === 'authors';
					topicModel.title = 'More ' + (topicModel.isAuthor ? 'from' : 'on');
					return {
						articles: articleModels,
						topic: topicModel,
						hasMainImage: articleModels[0].image
					};
				});

			res.render('related/more-on', {
				moreOns: moreOns
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
