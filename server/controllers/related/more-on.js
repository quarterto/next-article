'use strict';

var _ = require('lodash');
require('array.prototype.find');
var fetchres = require('fetchres');
var api = require('next-ft-api-client');
var cacheControl = require('../../utils/cache-control');
var resize = require('../../utils/resize');
var extractUuid = require('../../utils/extract-uuid');

function hasSemanticStream(taxonomy) {
	return ['people', 'organisations'].indexOf(taxonomy) > -1;
}

module.exports = function (req, res, next) {
	var topics = [];
	var metadataFields = (req.query['metadata-fields'] || '').split(',');
	var count = parseInt(req.query.count) || 5;

	api.contentLegacy({
		uuid: req.params.id,
		useElasticSearch: res.locals.flags.elasticSearchItemGet
	})
		.then(function (article) {
			res.set(cacheControl);
			var moreOnPromises = metadataFields
				.map(function (metadataField, index) {
					var topic = article.item.metadata[metadataField];
					// if it's an array, use the first
					if (Array.isArray(topic)) {
						topic = topic.shift();
					}
					if (!topic) {
						return null;
					}
					topics.push(topic);
					var promises = [];
					promises.push(api.searchLegacy({
						query: topic.term.taxonomy + ':="' + topic.term.name + '"',
						// get one extra, in case we dedupe
						count: count + 1
					}));
					if (res.locals.flags.semanticStreams && hasSemanticStream(topic.term.taxonomy)) {
						promises.push(
							api.mapping(topic.term.id, topic.term.taxonomy)
								.then(function (v2Topic) {
									topics[index].uuid = extractUuid(v2Topic.id);
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
				.map(function (result, index) {
					var articles = result[0];
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
						return null;
					}
					var promises = [];
					// get the first article's main image, if it exists (and not author's stories)
					if (!res.locals.flags.moreOnImages || !articleModels[0].mainImage || topics[index].taxonomy === 'authors') {
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
				.map(function (result, index) {
					var articleModels = result[0];
					var topic = topics[index];
					var topicModel = {
						name: topic.term.name,
						taxonomy: topic.term.taxonomy
					};
					topicModel.url = topic.uuid ?
						topicModel.taxonomy + '/' + topic.uuid :
						'/stream/' + encodeURIComponent(topicModel.taxonomy) + '/' + encodeURIComponent(topicModel.name);
					topicModel.isAuthor = topicModel.taxonomy === 'authors';
					topicModel.title = 'More ' + (topicModel.isAuthor ? 'from' : 'on');
					var otherArticleModels = _.flatten(results
						.slice(0, index)
						.map(function (result) { return result[0]; }));
					var dedupedArticles = _.filter(articleModels, function (articleModel) {
						return !otherArticleModels.find(function (otherArticleModel) {
							return otherArticleModel.id === articleModel.id;
						});
					});
					return {
						// dedupe
						articles: dedupedArticles,
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
