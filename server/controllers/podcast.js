'use strict';

var logger = require('ft-next-logger');
var api = require('next-ft-api-client');
var getDfp = require('../utils/get-dfp');
var cacheControl = require('../utils/cache-control');
var externalPodcastLinks = require('../utils/external-podcast-links');

module.exports = function(req, res, next) {

	function get(guid) {
		return api.contentLegacy({
			uuid: guid,
			useElasticSearch: true
		});
	}

	function map(data) {
		return {
			id: data.item.id,
			title: data.item.title.title,
			byline: data.item.editorial.byline,
			tags: data.item.metadata.tags,
			publishedDate: data.item.lifecycle.lastPublishDateTime,
			primaryTag: data.item.metadata.primarySection && data.item.metadata.primarySection.term,
			body: data.item.body.body,
			media: {
				type: data.item.assets[0].type,
				url: data.item.assets[0].fields.link
			},
			dfp: getDfp(data.item.metadata.sections)
		};
	}

	function decorate(data) {
		data.save = true;
		data.externalLinks = externalPodcastLinks(data.primaryTag.name);
		data.articleShareButtons = res.locals.flags.articleShareButtons;
		data.myFTTray = res.locals.flags.myFTTray;

		return data;
	}

	function render(data) {
		res.set(cacheControl);
		data.layout = 'wrapper';
		return res.render('podcast', data);
	}

	function error(err) {
		console.error(err.stack)
		next(err);
	}

	return get(req.params.id).then(map).then(decorate).then(render).catch(error);

};