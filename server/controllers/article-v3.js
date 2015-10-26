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

function transformMetadata(metadata, primaryTag) {
	let ignore = [ 'mediaType', 'iptc', 'icb' ];

	return metadata
		.filter(tag => {
			return !ignore.find(taxonomy => taxonomy === tag.taxonomy)
				&& (!primaryTag || tag.idV1 !== primaryTag.id);
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

function getPrimaryTag(metadata) {
	let primaryTheme = metadata.find(
		tag => tag.primary && tag.taxonomy !== 'sections'
	);

	let primarySection = metadata.find(
		tag => tag.primary && tag.taxonomy === 'sections'
	);

	// 'theme' takes precedence unless the section taxonomy is listed below
	let precedence = [ 'specialReports' ];
	let primaryTag = primaryTheme || primarySection || null;

	if (primarySection && precedence.indexOf(primarySection.taxonomy) > -1) {
		primaryTag = primarySection;
	}

	return primaryTag && {
		id: primaryTag.idV1,
		name: primaryTag.prefLabel,
		taxonomy: primaryTag.taxonomy
	};
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
			// End hacking for V1 and V2 compat.

			payload.primaryTag = getPrimaryTag(payload.metadata);
			payload.tags = transformMetadata(payload.metadata, payload.primaryTag);
			payload.isSpecialReport = payload.primaryTag && payload.primaryTag.taxonomy === 'specialReports';

			// TODO: barrier

			// TODO: implement this
			payload.dfp = null;
			payload.visualCat = null;
			payload.toc = null;
			payload.suggestedTopic = null;
			payload.moreOns = null;
			payload.dehydratedMetadata = null;

			res.set(cacheControlUtil);
			return res.render('article-v2', payload);
		})
		.catch(error => {
			logger.error(error);
			next(error);
		});

};
