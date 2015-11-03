'use strict';

const logger = require('ft-next-express').logger;
const cacheControlUtil = require('../utils/cache-control');
const getDfpUtil = require('../utils/get-dfp');
const barrierHelper = require('./article-helpers/barrier');
const suggestedHelper = require('./article-helpers/suggested');
const readNextHelper = require('../lib/read-next');
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
		v3: 1,
		id: article.id,
		webUrl: article.webUrl,
		renderTOC: flags.articleTOC ? 1 : 0,
		renderSlideshows: flags.galleries ? 1 : 0,
		renderSocial: flags.articleShareButtons ? 1 : 0,
		suggestedRead: flags.articleSuggestedRead ? 1 : 0,
		useBrightcovePlayer: flags.brightcovePlayer ? 1 : 0,
		fullWidthMainImages: flags.fullWidthMainImages ? 1 : 0,
		reserveSpaceForMasterImage: flags.reserveSpaceForMasterImage ? 1 : 0,
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

function transformMetadata(metadata) {
	return metadata.map(tag => {
		let v1 = {
			id: tag.idV1,
			name: tag.prefLabel,
			url: `/stream/${tag.taxonomy}Id/${tag.idV1}`
		};

		return Object.assign(v1, tag);
	});
}

function getPrimaryTheme(metadata) {
	return metadata.find(tag => tag.primary === 'theme');
}

function getPrimarySection(metadata) {
	return metadata.find(tag => tag.primary === 'section');
}

function getPrimaryTag(primaryTheme, primarySection) {
	let precedence = [ 'specialReports' ];
	let primaryTag = primaryTheme || primarySection || null;

	if (primarySection && precedence.indexOf(primarySection.taxonomy) > -1) {
		primaryTag = primarySection;
	}

	return primaryTag;
}

function getTagsForDisplay(metadata, primaryTag) {
	let ignore = [ 'mediaType', 'iptc', 'icb' ];

	return metadata
		.filter(tag => {
			return !ignore.find(taxonomy => taxonomy === tag.taxonomy)
				&& (!primaryTag || tag.id !== primaryTag.id);
		})
		.slice(0, 5);
}

function getMoreOnTags(primaryTheme, primarySection) {
	let moreOnTags = [];

	// TODO: Improve dehydrated data so this isn't necessary
	primaryTheme && moreOnTags.push(
		Object.assign({ metadata: 'primaryTheme' }, primaryTheme)
	);

	primarySection && moreOnTags.push(
		Object.assign({ metadata: 'primarySection' }, primarySection)
	);

	if (!moreOnTags.length) {
		return;
	}

	// TODO: display should be up to the template
	moreOnTags[moreOnTags.length -1].class = 'more-on--small';

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

function getDfpMetadata(metadata) {
	// TODO: remove extraneous 'term' nesting
	return getDfpUtil(
		metadata.map(tag => {
			return { term: tag };
		})
	);
}

function getOpenGraphData(article) {
	// TODO: this can be dealt with in the template
	return {
		title: article.title,
		description: article.summaries ? article.summaries[0] : '',
		image: article.mainImage && article.mainImage.url,
		url: `https://next.ft.com/content/${article.id}`
	};
}

function getTwitterCardData(article) {
	// TODO: this can be dealt with in the template
	let openGraph = getOpenGraphData(article);
	openGraph.card = openGraph.image ? 'summary_large_image' : 'summary';
	return openGraph;
}

function getSuggestedReads(storyPackageIds, articleId, primaryTag) {
	return suggestedHelper(storyPackageIds, articleId, primaryTag);
}

module.exports = function articleV3Controller(req, res, next, payload) {
	let asyncWorkToDo = [];

	if (res.locals.barrier) {
		return res.render('article-v2', barrierHelper(payload, res.locals.barrier));
	}

	if (res.locals.firstClickFreeModel) {
		payload.firstClickFree = res.locals.firstClickFreeModel;
	}

	// Make metadata speak the same language as V1
	payload.metadata = transformMetadata(payload.metadata)

	let primarySection = getPrimarySection(payload.metadata);
	let primaryTheme = getPrimaryTheme(payload.metadata);
	let primaryTag = getPrimaryTag(primaryTheme, primarySection);

	payload.primaryTag = primaryTag;
	payload.tags = getTagsForDisplay(payload.metadata, primaryTag);
	payload.isSpecialReport = primaryTag && primaryTag.taxonomy === 'specialReports';

	asyncWorkToDo.push(
		transformArticleBody(payload, res.locals.flags).then(fragments => {
			payload.body = fragments.body;
			payload.toc = fragments.toc;
		})
	);

	// Decorate with related stuff
	payload.moreOns = getMoreOnTags(primaryTheme, primarySection);

	// <<< hacking for V1 and V2 compat.
	payload.articleV1 = isCapiV1(payload);
	payload.articleV2 = isCapiV2(payload);

	payload.standFirst = payload.summaries ? payload.summaries[0] : '';

	// TODO: remove extraneous 'term' nesting
	payload.dehydratedMetadata = {
		primarySection: { term: primarySection },
		primaryTheme: { term: primaryTheme },
		package: payload.storyPackage || [],
	};

	payload.dfp = getDfpMetadata(payload.metadata);
	// >>> hacking for V1 and V2 compat.

	if (res.locals.flags.openGraph) {
		payload.og = getOpenGraphData(payload);
	}

	if (res.locals.flags.twitterCards) {
		payload.twitterCard = getTwitterCardData(payload);
	}

	if (res.locals.flags.articleSuggestedRead && payload.metadata.length) {
		let storyPackageIds = (payload.storyPackage || []).map(story => story.id);

		asyncWorkToDo.push(
			getSuggestedReads(storyPackageIds, payload.id, primaryTag).then(
				articles => payload.readNextArticles = articles
			)
		);

		asyncWorkToDo.push(
			readNextHelper(storyPackageIds, payload.id, primaryTag, payload.publishedDate).then(
				article => payload.readNextArticle = article
			)
		);

		payload.suggestedTopic = primaryTag;
	}

	payload.byline = bylineTransform(payload.byline, payload.metadata.filter(item => item.taxonomy === 'authors'));

	// TODO: implement this
	payload.visualCat = null;

	return Promise.all(asyncWorkToDo)
		.then(() => {
			payload.layout = 'wrapper';
			return res.set(cacheControlUtil).render('article-v2', payload);
		})
		.catch(error => {
			logger.error(error);
			next(error);
		});
};
