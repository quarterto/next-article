'use strict';

const logger = require('ft-next-express').logger;
const cacheControlUtil = require('../utils/cache-control');
const getDfpUtil = require('../utils/get-dfp');
const barrierHelper = require('./article-helpers/barrier');
const suggestedHelper = require('./article-helpers/suggested');
const readNextHelper = require('./article-helpers/read-next');
const decorateMetadataHelper = require('./article-helpers/decorate-metadata');
const openGraphHelper = require('./article-helpers/open-graph');
const articleXsltTransform = require('../transforms/article-xslt');
const bodyTransform = require('../transforms/body');
const bylineTransform = require('../transforms/byline');
const articleBranding = require('ft-n-article-branding');

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
	let xsltParams = {
		id: article.id,
		webUrl: article.webUrl,
		renderTOC: flags.articleTOC ? 1 : 0,
		suggestedRead: flags.articleSuggestedRead ? 1 : 0,
		useBrightcovePlayer: flags.brightcovePlayer ? 1 : 0
	};

	return articleXsltTransform(article.bodyXML, 'main', xsltParams).then(articleBody => {
		return bodyTransform(articleBody, flags);
	});
}

function getMoreOnTags(primaryTheme, primarySection, primaryBrand) {
	let moreOnTags = [];

	primaryTheme && moreOnTags.push(primaryTheme);
	primarySection && moreOnTags.push(primarySection);
	primaryBrand && moreOnTags.push(primaryBrand);

	if (!moreOnTags.length) {
		return;
	}

	return moreOnTags.slice(0, 2).map(tag => {
		let title;

		switch (tag.taxonomy) {
			case 'authors':
				title = 'from';
				break;
			case 'brand':
				title = 'from';
				break;
			case 'sections':
				title = 'in';
				break;
			case 'genre':
				title = '';
				break;
			default:
				title = 'on';
		}

		tag.title = title;

		return tag;
	});
}

module.exports = function articleV3Controller(req, res, next, payload) {

	let asyncWorkToDo = [];

	// Required for correctly tracking page / barrier views
	if (req.get('FT-Barrier-Type') !== '-') {
		payload.barrierType = req.get('FT-Barrier-Type');
	}

	if (req.get('FT-Corporate-Id') !== '-') {
		payload.corporateId = req.get('FT-Corporate-Id');
	}

	if (res.locals.barrier) {
		return res.render('article', barrierHelper(payload, res.locals.barrier));
	}

	if (res.locals.firstClickFreeModel) {
		payload.firstClickFree = res.locals.firstClickFreeModel;
	}

	// Decorate article with primary tags and tags for display
	decorateMetadataHelper(payload);
	payload.isSpecialReport = payload.primaryTag && payload.primaryTag.taxonomy === 'specialReports';

	asyncWorkToDo.push(
		transformArticleBody(payload, res.locals.flags).then(fragments => {
			payload.bodyHtml = fragments.bodyHtml;
			payload.tocHtml = fragments.tocHtml;
			payload.mainImageHtml = fragments.mainImageHtml;
		})
	);
	payload.designGenre = articleBranding(payload.metadata);

	// Decorate with related stuff
	payload.moreOns = getMoreOnTags(payload.primaryTheme, payload.primarySection, payload.primaryBrand);

	payload.articleV1 = isCapiV1(payload);
	payload.articleV2 = isCapiV2(payload);

	// TODO: move this to template or re-name subheading
	payload.standFirst = payload.summaries ? payload.summaries[0] : '';

	payload.byline = bylineTransform(payload.byline, payload.metadata.filter(item => item.taxonomy === 'authors'));

	payload.dehydratedMetadata = {
		moreOns: payload.moreOns,
		package: payload.storyPackage || [],
	};

	payload.dfp = getDfpUtil(payload.metadata);

	if (res.locals.flags.openGraph) {
		openGraphHelper(payload);
	}

	if (res.locals.flags.articleSuggestedRead && payload.metadata.length) {
		let storyPackageIds = (payload.storyPackage || []).map(story => story.id);

		asyncWorkToDo.push(
			suggestedHelper(payload.id, storyPackageIds, payload.primaryTag).then(
				articles => payload.readNextArticles = articles
			)
		);

		asyncWorkToDo.push(
			readNextHelper(payload.id, storyPackageIds, payload.primaryTag, payload.publishedDate).then(
				article => payload.readNextArticle = article
			)
		);

		payload.suggestedTopic = payload.primaryTag;
	}

	if (req.get('FT-Labs-Gift') === 'GRANTED') {
		payload.shared = true;
		res.vary('FT-Labs-Gift');
	}

	return Promise.all(asyncWorkToDo)
		.then(() => {
			res.set(cacheControlUtil);
			if (req.query.fragment) {
				if (!req.query.bare) {
					payload.layout = 'vanilla';
				}
				res.render('fragment', payload);
			} else {
				payload.layout = 'wrapper';
				res.render('article', payload);
			}
		})
		.catch(error => {
			logger.error(error);
			next(error);
		});
};
