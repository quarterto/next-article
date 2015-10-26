'use strict';

var fetchres = require('fetchres');
var api = require('next-ft-api-client');
var logger = require('ft-next-express').logger;
var bylineTransform = require('../transforms/byline');
var cacheControl = require('../utils/cache-control');
var extractTags = require('../utils/extract-tags');
var extractUuid = require('../utils/extract-uuid');
var images = require('../transforms/images');
var articlePrimaryTag = require('ft-next-article-primary-tag');
var bodyTransform = require('../transforms/body');
var getVisualCategorisation = require('ft-next-article-genre');
var articleXSLT = require('../transforms/article-xslt');
var openGraph = require('../utils/open-graph');
var twitterCardSummary = require('../utils/twitter-card').summary;
var getDfp = require('../utils/get-dfp');
var suggestedHelper = require('./article-helpers/suggested');
var barrierHelper = require('./article-helpers/barrier');
var articleTopicMapping = require('../mappings/article-topic-mapping');
var readNext = require('../lib/read-next');
var articlePodMapping = require('../mappings/article-pod-mapping');

module.exports = function articleLegacyController(req, res, next, payload) {

	var socialMediaImage = function (articleV2) {

		// don't bother if there's no main image to fetch
		if (!articleV2.mainImage) {
			return Promise.resolve();
		}

		// don't bother if social media flags are off
		if (!res.locals.flags.openGraph && !res.locals.flags.twitterCards) {
			return Promise.resolve();
		}

		return api.content({ uuid: extractUuid(articleV2.mainImage.id), type: 'ImageSet', retry: 0 })
			.then(function (images) {
				var image = images.members[0];
				return api.content({ uuid: extractUuid(image.id), type: 'ImageSet', retry: 0 });
			})
			.catch(function(err) {
				if (fetchres.originatedError(err)) {
					return;
				} else {
					throw err;
				}
			});
	};

	Promise.all([
		Promise.resolve(payload[0]),
		Promise.resolve(payload[1]),
		articleXSLT(payload[1].bodyXML, 'main', {
			renderSlideshows: res.locals.flags.galleries ? 1 : 0,
			renderInteractiveGraphics: res.locals.flags.articleInlineInteractiveGraphics ? 1 : 0,
			useBrightcovePlayer: res.locals.flags.brightcovePlayer ? 1 : 0,
			renderTOC: res.locals.flags.articleTOC ? 1 : 0,
			fullWidthMainImages: res.locals.flags.fullWidthMainImages ? 1 : 0,
			reserveSpaceForMasterImage: res.locals.flags.reserveSpaceForMasterImage ? 1 : 0,
			suggestedRead: res.locals.flags.articleSuggestedRead ? 1 : 0,
			standFirst: payload[0] ? payload[0].item.editorial.standFirst : "",
			renderSocial: res.locals.flags.articleShareButtons ? 1 : 0,
			id: extractUuid(payload[1].id),
			webUrl: payload[0] && payload[0].item && payload[0].item.location ? payload[0].item.location.uri : '',
			encodedTitle: encodeURIComponent(payload[1].title.replace(/\&nbsp\;/g, ' '))
		}),
		socialMediaImage(payload[1]),
		res.locals.flags.articleSuggestedRead && payload[0] ? readNext(payload[0], res.locals.flags.elasticSearchItemGet, res.locals.flags.elasticSearchOnAws) : Promise.resolve(),
		suggestedHelper(payload[0]).then(function(it) {
			return api.contentLegacy({
				uuid: (it && it.ids) || [],
				useElasticSearch: res.locals.flags.elasticSearchItemGet,
				useElasticSearchOnAws: res.locals.flags.elasticSearchOnAws
			});
		})
	])
		.then(function(results) {
			res.set(cacheControl);

			var articleV1 = results[0];
			var articleV2 = results[1];
			var mainImage = results[3];
			var readNextArticle = results[4];
			var readNextArticles = results[5].map(it => articlePodMapping(it));

			var $ = bodyTransform(results[2], res.locals.flags);

			var metadata = articleV1 && articleV1.item && articleV1.item.metadata;
			var primaryTag = metadata ? articlePrimaryTag(metadata) : undefined;
			var isSpecialReport = metadata && metadata.primarySection.term.taxonomy === 'specialReports';

			if (isSpecialReport) {
				primaryTag = metadata && metadata.primarySection.term;
			}

			if (primaryTag) {
				primaryTag.conceptId = primaryTag.id;
				primaryTag.url = '/stream/' + primaryTag.taxonomy + 'Id/' + primaryTag.id;
			}

			if (metadata && metadata.primarySection) {
			//specialReport is a circular - if it exists, delete it before dehydrating it
				if (metadata.primarySection.term.specialReport) {
					delete metadata.primarySection.term.specialReport;
				}
			//if primarySection is Columnists, replace with Author
				if (
					metadata.primarySection.term.name === 'Columnists' &&
					metadata.authors.length &&
					(metadata.authors[0].term.id !== metadata.primaryTheme.term.id)
				) {
					metadata.primarySection.term = metadata.authors[0].term;
				}
			}

			var dehydratedMetadata = {
				primaryTheme: metadata && metadata.primaryTheme ? metadata.primaryTheme : null,
				primarySection: metadata && metadata.primarySection ? metadata.primarySection : null,
				package: articleV1 && articleV1.item && articleV1.item.package ? articleV1.item.package : null
			};

			// Update the images (resize, add image captions, etc)
			return images($, {
				fullWidthMainImages: res.locals.flags.fullWidthMainImages
			})
				.then(function($) {
					var viewModel = {
						firstClickFree: null,
						comments: articleV2.comments && articleV2.comments.enabled,
						articleV1: !!articleV1,
						articleV2: true,
						id: extractUuid(articleV2.id),
						title: articleV2.title,
						publishedDate: articleV2.publishedDate,
						standFirst: articleV1 && articleV1.item.editorial.standFirst,
						byline: bylineTransform(articleV2.byline, articleV1),
						tags: extractTags(articleV2, articleV1, res.locals.flags, primaryTag),
						body: $.html(),
						toc: $.html('.article__toc'),
						layout: 'wrapper',
						primaryTag: primaryTag,
						suggestedTopic: articleV1 && articleV1.item ? articleTopicMapping(articleV1.item.metadata) : null,
						moreOns: {},
						dfp: metadata ? getDfp(metadata.sections) : undefined,
						visualCat: metadata ? getVisualCategorisation(metadata) : undefined,
						isSpecialReport: isSpecialReport,
						dehydratedMetadata: dehydratedMetadata
					};

					if (metadata) {
						var moreOnTags = [];
						// primary theme first
						if (metadata.primaryTheme) {
							var primaryThemeTag = metadata.primaryTheme.term;
							primaryThemeTag.metadata = 'primaryTheme';
							moreOnTags.push(primaryThemeTag);
						}
						// then author, if this is in a 'Columnists' section and not a duplication of the primaryTheme
						if (
							metadata.primarySection.term.name === 'Columnists' &&
							metadata.authors.length &&
							(!moreOnTags.length || metadata.authors[0].term.id !== moreOnTags[0].id)
						) {
							var authorTag = metadata.authors[0].term;
							authorTag.metadata = 'authors';
							moreOnTags.push(authorTag);
						}
						// finally the primarySection
						var primarySectionTag = metadata.primarySection.term;
						primarySectionTag.metadata = 'primarySection';
						moreOnTags.push(primarySectionTag);
						viewModel.moreOns = moreOnTags
							.slice(0, 2)
							.map(function(moreOnTag) {
								var title;

								switch (moreOnTag.taxonomy) {
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

								return {
									name: moreOnTag.name,
									url: '/stream/' + moreOnTag.taxonomy + 'Id/' + moreOnTag.id,
									taxonomy: moreOnTag.taxonomy,
									metadata: moreOnTag.metadata,
									id: moreOnTag.id,
									title: title
								};
							});
						// add 'small' class if just one
						viewModel.moreOns[viewModel.moreOns.length === 1 ? 0 : 1].class = 'more-on--small';
					}

					if (res.locals.flags.openGraph) {
						viewModel.og = openGraph(articleV2, articleV1, mainImage);
					}

					if (res.locals.flags.twitterCards) {
						viewModel.twitterCard = twitterCardSummary(articleV2, articleV1, mainImage);
					}

					if (res.locals.flags.articleSuggestedRead) {
						viewModel.readNextArticles = readNextArticles;
						viewModel.readNextArticle = readNextArticle;
					}

					if (res.locals.barrier) {
						viewModel = barrierHelper(viewModel, res.locals.barrier);
					}

					if (res.locals.firstClickFreeModel) {
						viewModel.firstClickFree = res.locals.firstClickFreeModel;
					}

					return viewModel;
				})
				.then(function(viewModel) {
					return res.render('article-v2', viewModel);
				})
				.catch(function(error) {
					logger.error(error);
					next(error);
				});
		});
};
