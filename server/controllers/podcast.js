'use strict';

const logger = require('ft-next-express').logger;
const cacheControlUtil = require('../utils/cache-control');
const getDfpUtil = require('../utils/get-dfp');
const suggestedHelper = require('./article-helpers/suggested');
const decorateMetadataHelper = require('./article-helpers/decorate-metadata');
const externalPodcastLinksUtil = require('../utils/external-podcast-links');

module.exports = function podcastLegacyController(req, res, next, payload) {
	let asyncWorkToDo = [];

	// Decorate article with primary tags and tags for display
	decorateMetadataHelper(payload);

	// TODO: move this to template or re-name subheading
	payload.standFirst = payload.summaries ? payload.summaries[0] : '';

	payload.dfp = getDfpUtil(payload.metadata);

	// Append podcast specific data
	payload.externalLinks = externalPodcastLinksUtil(payload.provenance[0]);
	payload.media = payload.attachments[0];

	// TODO
	// if (res.locals.flags.openGraph) {
	// 	payload.og = getOpenGraphData(payload);
	// }

	// if (res.locals.flags.twitterCards) {
	// 	payload.twitterCard = getTwitterCardData(payload);
	// }

	asyncWorkToDo.push(
		suggestedHelper(payload.id, [], payload.primaryTag).then(
			articles => payload.relatedContent = articles
		)
	);

	return Promise.all(asyncWorkToDo)
		.then(() => {
			payload.layout = 'wrapper';
			return res.set(cacheControlUtil).render('podcast', payload);
		})
		.catch(error => {
			logger.error(error);
			next(error);
		});
};
