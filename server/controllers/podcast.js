'use strict';

var api = require('next-ft-api-client');
var getDfp = require('../utils/get-dfp');
var cacheControl = require('../utils/cache-control');
var externalPodcastLinks = require('../utils/external-podcast-links');

module.exports = function podcastController(req, res, next) {

	function getArticle(guid) {
		return api.contentLegacy({
			uuid: guid,
			useElasticSearch: true
		});
	}

	function mapArticle(data) {
		return {
			id: data.item.id,
			title: data.item.title.title,
			byline: data.item.editorial.byline,
			tags: data.item.metadata.tags,
			publishedDate: data.item.lifecycle.lastPublishDateTime,
			primaryTag: data.item.metadata.primarySection.term,
			body: data.item.body.body,
			source: data.item.master.masterSource,
			media: {
				type: data.item.assets[0].type,
				url: data.item.assets[0].fields.link
			},
			metadata: data.item.metadata
		};
	}

	function getRelated(article) {
		var related = api.searchLegacy({
			query: article.primaryTag.taxonomy + 'Id:"' + article.primaryTag.id + '"',
			count: 5,
			// Hack: the default option for the client is an empty array so no fields will
			// be returned. I don't want to type all the fields here. This invalid value
			// will be ignored by ES and will fall back to returning all the fields.
			fields: true,
			useElasticSearch: true
		}).catch(function() { return []; });

		return Promise.all([article, related]);
	}

	function mapRelated(fulfilled) {
		var article = fulfilled[0];
		var related = fulfilled[1];

		article.relatedContent = Array.isArray(related) && related
			.map(function(raw) {
				var item = raw._source.item;

				// TODO: This mapping is different to the one above. Why?
				return {
					id: item.id,
					headline: item.title.title,
					subheading: item.summary.excerpt,
					lastUpdated: item.lifecycle.lastPublishDateTime,
					image: item.images && item.images[0] && {
						url: item.images[0].url,
						alt: item.images[0].alt,
						srcset: {
							s: 100,
							m: 200
						}
					}
				};
			})
			.filter(function(item) {
				return item.id !== article.id;
			})
			.slice(0, 4);

		return article;
	}

	function decorate(data) {
		data.save = true;
		data.externalLinks = externalPodcastLinks(data.source);
		data.dfp = getDfp(data.metadata.sections);

		return data;
	}

	function render(data) {
		res.set(cacheControl);
		data.layout = 'wrapper';
		return res.render('podcast', data);
	}

	function error(err) {
		next(err);
	}

	return getArticle(req.params.id)
		.then(mapArticle)
		.then(getRelated)
		.then(mapRelated)
		.then(decorate)
		.then(render)
		.catch(error);
};
