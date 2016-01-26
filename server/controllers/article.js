'use strict';

const logger = require('ft-next-express').logger;
const cacheControlUtil = require('../utils/cache-control');
const getDfpUtil = require('../utils/get-dfp');
const addTagTitlePrefix = require('./article-helpers/tag-title-prefix');
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

	return moreOnTags.slice(0, 2).map(addTagTitlePrefix);
}

module.exports = function articleV3Controller(req, res, next, content) {

	let asyncWorkToDo = [];

	// Required for correctly tracking page / barrier views
	if (req.get('FT-Barrier-Type') !== '-') {
		content.barrierType = req.get('FT-Barrier-Type');
	}

	if (req.get('FT-Corporate-Id') !== '-') {
		content.corporateId = req.get('FT-Corporate-Id');
	}

	if (res.locals.barrier) {
		return res.render('article', barrierHelper(content, res.locals.barrier));
	}

	if (res.locals.flags.analytics) {
		content.ijentoConfig = {
			uuid: content.id,
			code: (/cms\/s\/([0-3])\//i.exec(content.webUrl) || [, null])[1],
			type: 'Story'
		};
	}

	if (req.query.myftTopics) {
		content.myftTopics = req.query.myftTopics.split(',');
	}

	//When a user comes to an article from a myFT promo area, we want to push them to follow the topic they came from
	if (req.query.tagToFollow) {
		content.tagToFollow = req.query.tagToFollow;
	}

	// Decorate article with primary tags and tags for display
	decorateMetadataHelper(content);
	content.isSpecialReport = content.primaryTag && content.primaryTag.taxonomy === 'specialReports';

	asyncWorkToDo.push(
		transformArticleBody(content, res.locals.flags).then(fragments => {
			content.bodyHtml = fragments.bodyHtml;
			content.tocHtml = fragments.tocHtml;
			content.mainImageHtml = fragments.mainImageHtml;
		})
	);
	content.designGenre = articleBranding(content.metadata);

	// Decorate with related stuff
	content.moreOns = getMoreOnTags(content.primaryTheme, content.primarySection, content.primaryBrand);

	content.articleV1 = isCapiV1(content);
	content.articleV2 = isCapiV2(content);

	// TODO: move this to template or re-name subheading
	content.standFirst = content.summaries ? content.summaries[0] : '';

	content.byline = bylineTransform(content.byline, content.metadata.filter(item => item.taxonomy === 'authors'));

	content.dehydratedMetadata = {
		moreOns: content.moreOns,
		package: content.storyPackage || [],
	};

	content.dfp = getDfpUtil(content.metadata);

	if (res.locals.flags.openGraph) {
		openGraphHelper(content);
	}

	if (res.locals.flags.articleSuggestedRead && content.metadata.length) {
		let storyPackageIds = (content.storyPackage || []).map(story => story.id);

		asyncWorkToDo.push(
			suggestedHelper(content.id, storyPackageIds, content.primaryTag).then(
				articles => content.readNextArticles = articles
			)
		);

		asyncWorkToDo.push(
			readNextHelper(content.id, storyPackageIds, content.primaryTag, content.publishedDate).then(
				article => content.readNextArticle = article
			)
		);

		content.suggestedTopic = content.primaryTag;
	}

	if (req.get('FT-Labs-Gift') === 'GRANTED') {
		content.shared = true;
		res.vary('FT-Labs-Gift');
	}

	return Promise.all(asyncWorkToDo)
		.then(() => {
			res.set(cacheControlUtil);
			if (req.query.fragment) {
				res.render('fragment', content);
			} else {
				content.layout = 'wrapper';
				res.render('article', content);
			}
		})
		.catch(error => {
			logger.error(error);
			next(error);
		});
};
