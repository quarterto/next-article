'use strict';

const logger = require('ft-next-express').logger;
const cacheControlUtil = require('../utils/cache-control');
const getDfpUtil = require('../utils/get-dfp');
const barrierHelper = require('./article-helpers/barrier');
const suggestedHelper = require('./article-helpers/suggested');
const readNextHelper = require('./article-helpers/read-next');
const decorateMetadataHelper = require('./article-helpers/decorate-metadata');
const articleXsltTransform = require('../transforms/article-xslt');
const bodyTransform = require('../transforms/body');
const bylineTransform = require('../transforms/byline');

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
		renderSlideshows: flags.galleries ? 1 : 0,
		renderSocial: flags.articleShareButtons ? 1 : 0,
		suggestedRead: flags.articleSuggestedRead ? 1 : 0,
		useBrightcovePlayer: flags.brightcovePlayer ? 1 : 0,
		fullWidthMainImages: flags.fullWidthMainImages ? 1 : 0,
		renderInteractiveGraphics: flags.articleInlineInteractiveGraphics ? 1 : 0,
		encodedTitle: encodeURIComponent(article.title.replace(/\&nbsp\;/g, ' '))
	};

	return articleXsltTransform(article.bodyXML, 'main', xsltParams).then(articleBody => {
		let $ = bodyTransform(articleBody, flags);

		return {
			body: $.html(),
			toc: $.html('.article__toc')
		};
	});
}

function getMoreOnTags(primaryTheme, primarySection) {
	let moreOnTags = [];

	primaryTheme && moreOnTags.push(primaryTheme);
	primarySection && moreOnTags.push(primarySection);

	if (!moreOnTags.length) {
		return;
	}

	return moreOnTags.map(tag => {
		let title;

		switch (tag.taxonomy) {
			case 'authors':
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

function getOpenGraphData(article) {
	return {
		title: article.title,
		description: article.summaries ? article.summaries[0] : '',
		image: article.mainImage && article.mainImage.url,
		url: `https://next.ft.com/content/${article.id}`
	};
}

function getTwitterCardData(article) {
	let openGraph = getOpenGraphData(article);
	openGraph.card = openGraph.image ? 'summary_large_image' : 'summary';
	return openGraph;
}

module.exports = function articleV3Controller(req, res, next, payload) {
	let asyncWorkToDo = [];

	if (res.locals.barrier) {
		return res.render('article', barrierHelper(payload, res.locals.barrier));
	}

	if (res.locals.firstClickFreeModel) {
		payload.firstClickFree = res.locals.firstClickFreeModel;
	}

	// Decorate metadata such as primary tags and tags for display
	decorateMetadataHelper(payload);
	payload.isSpecialReport = payload.primaryTag && payload.primaryTag.taxonomy === 'specialReports';

	asyncWorkToDo.push(
		transformArticleBody(payload, res.locals.flags).then(fragments => {
			payload.body = fragments.body;
			payload.toc = fragments.toc;
		})
	);

	// Decorate with related stuff
	payload.moreOns = getMoreOnTags(payload.primaryTheme, payload.primarySection);

	payload.articleV1 = isCapiV1(payload);
	payload.articleV2 = isCapiV2(payload);

	payload.standFirst = payload.summaries ? payload.summaries[0] : '';

	payload.dehydratedMetadata = {
		moreOns: payload.moreOns,
		package: payload.storyPackage || [],
	};

	payload.dfp = getDfpUtil(payload.metadata);

	if (res.locals.flags.openGraph) {
		payload.og = getOpenGraphData(payload);
	}

	if (res.locals.flags.twitterCards) {
		payload.twitterCard = getTwitterCardData(payload);
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

	payload.byline = bylineTransform(payload.byline, payload.metadata.filter(item => item.taxonomy === 'authors'));

	// TODO: implement this
	payload.visualCat = null;

	return Promise.all(asyncWorkToDo)
		.then(() => {
			payload.layout = 'wrapper';
			return res.set(cacheControlUtil).render('article', payload);
		})
		.catch(error => {
			logger.error(error);
			next(error);
		});
};
