'use strict';

const logger = require('ft-next-express').logger;
const cacheControlUtil = require('../utils/cache-control');
const articleXsltTransform = require('../transforms/article-xslt');
const bodyTransform = require('../transforms/body');

function isCapiV1(article) {
	return article.provenance.find(
	 	source => source.includes('http://api.ft.com/content/items/v1/')
	);
}

function isCapiV2(article) {
	return article.provenance.find(
		source => source.includes('http://api.ft.com/enrichedcontent/')
	);
}

function transformArticleBody(article, flags) {
	// Return plain HTML for non-CAPI V2 content
	if (!isCapiV2(article)) {
		return Promise.resolve(article.bodyXML);
	}

	let xsltParams = {
		v3: 1,
		renderSlideshows: flags.galleries ? 1 : 0,
		renderInteractiveGraphics: flags.articleInlineInteractiveGraphics ? 1 : 0,
		useBrightcovePlayer: flags.brightcovePlayer ? 1 : 0,
		renderTOC: flags.articleTOC ? 1 : 0,
		fullWidthMainImages: flags.fullWidthMainImages ? 1 : 0,
		reserveSpaceForMasterImage: flags.reserveSpaceForMasterImage ? 1 : 0,
		suggestedRead: flags.articleSuggestedRead ? 1 : 0,
		standFirst: article.summaries[0],
		renderSocial: flags.articleShareButtons ? 1 : 0,
		id: article.id,
		webUrl: article.webUrl,
		encodedTitle: encodeURIComponent(article.title.replace(/\&nbsp\;/g, ' '))
	};

	return articleXsltTransform(article.bodyXML, 'main', xsltParams)
		.then(articleBody => bodyTransform(articleBody, flags).html());
}

function transformMetadata(metadata) {
	let ignore = [ 'mediaType', 'iptc', 'icb' ];

	return metadata
		.filter(tag => {
			return !ignore.find(taxonomy => taxonomy === tag.taxonomy);
		})
		.map(tag => {
			return {
				id: tag.idV1,
				name: tag.prefLabel,
				url: `/stream/${tag.taxonomy}Id/${tag.idV1}`
			};
		})
		.slice(0, 5);
}

module.exports = function articleV3Controller(req, res, next, payload) {

	return transformArticleBody(payload, res.locals.flags)
		.then(articleBody => {

			payload.body = articleBody;
			payload.layout = 'wrapper';

			// Start hacking for V1 and V2 compat.
			payload.articleV1 = isCapiV1(payload);
			payload.articleV2 = isCapiV2(payload);
			payload.standFirst = payload.summaries[0];
			payload.tags = transformMetadata(payload.metadata);
			// End hacking for V1 and V2 compat.

			// TODO: barrier

			// TODO: implement this
			payload.dfp = null;
			payload.visualCat = null;
			payload.isSpecialReport = null;
			payload.toc = null;
			payload.primaryTag = null;
			payload.suggestedTopic = null;
			payload.save = null;
			payload.moreOns = null;
			payload.dehydratedMetadata = null;

			// TODO: Passing flags is not necessary
			payload.firstClickFree = res.locals.firstClickFreeModel;
			payload.relatedContent = res.locals.flags.articleRelatedContent;
			payload.shareButtons = res.locals.flags.articleShareButtons;
			payload.myFTTray = res.locals.flags.myFTTray;

			res.set(cacheControlUtil);
			return res.render('article-v2', payload);
		})
		.catch(error => {
			logger.error(error);
			next(error);
		});

};
