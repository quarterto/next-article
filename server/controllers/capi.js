'use strict';

var fetchCapiV1 = require('../utils/fetch-capi-v1');
var fetchCapiV2 = require('../utils/fetch-capi-v2');
var cacheControl = require('../utils/cache-control');
var fetchres = require('fetchres');
var cheerio = require('cheerio');
var pullQuotesTransform = require('../transforms/pull-quotes');
var bigNumberTransform = require('../transforms/big-number');
var ftContentTransform = require('../transforms/ft-content');
var relativeLinksTransform = require('../transforms/relative-links');
var slideshowTransform = require('../transforms/slideshow');
var trimmedLinksTransform = require('../transforms/trimmed-links');
var pHackTransform = require('../transforms/p-hack');
var subheadersTransform = require('../transforms/subheaders');
var addSubheaderIds = require('../transforms/add-subheader-ids');
var replaceHrs = require('../transforms/replace-hrs');
var replaceEllipses = require('../transforms/replace-ellipses');
var pStrongsToH3s = require('../transforms/p-strongs-to-h3s');
var externalImgTransform = require('../transforms/external-img');
var removeBodyTransform = require('../transforms/remove-body');

var getMentions = function(annotations) {
	annotations = annotations || [];
	return annotations.filter(function(an) {
		return an.predicate.indexOf('mentions') > -1;
	}).map(function(an) {

		//TODO : this should go in next-express topicUrl helper
		try {
			var pluralisedType = an.type === 'PERSON' ? 'people' : an.type.toLowerCase() + 's';
			return {
				url: '/stream/' + pluralisedType + '/' + an.uri.split('/').pop(),
				name: an.label
			};
		} catch (e) {
			return {
				url: '#',
				name: 'unavailable'
			};
		}
	});
};

module.exports = function(req, res, next) {
	var articleV1Promise = fetchCapiV1({
			uuid: req.params[0],
			useElasticSearch: res.locals.flags.elasticSearchItemGet.isSwitchedOn
		});
	var articleV2Promise = fetchCapiV2({ uuid: req.params[0] });

	Promise.all([articleV1Promise, articleV2Promise])
		.then(function(articles) {
			var articleV1 = res.locals.flags.elasticSearchItemGet.isSwitchedOn ? articles[0]._source : articles[0],
				article = articles[1];

			res.vary(['Accept-Encoding', 'Accept']);
			res.set(cacheControl);
			switch(req.accepts(['html', 'json'])) {
				case 'html':
					article.bodyXML = replaceEllipses(article.bodyXML);
					article.bodyXML = replaceHrs(article.bodyXML);
					article.bodyXML = pStrongsToH3s(article.bodyXML);
					var $ = cheerio.load(article.bodyXML);

					$('a[href*=\'#slide0\']').replaceWith(slideshowTransform);
					$('big-number').replaceWith(bigNumberTransform);
					$('img').replaceWith(externalImgTransform);
					$('ft-content').replaceWith(ftContentTransform);
					$('p').replaceWith(pHackTransform);
					$('blockquote').attr('class', 'article__block-quote o-quote o-quote--standard');
					$('pull-quote').replaceWith(pullQuotesTransform);
					$('body').replaceWith(removeBodyTransform);

					// insert test related
					if ($('ft-paragraph').length >= 6) {
						var paraHook = $('ft-paragraph').get(4);
						$(paraHook).prepend('<div class="js-more-on-inline"></div>');
					}

					// HACK - Fix for paragraphs in blockquotes
					$('blockquote > ft-paragraph').replaceWith(function(index, el) {
						el = $(el);
						return '<p>' + el.html() + '</p>';
					});
					$('a').replaceWith(relativeLinksTransform);
					$('a').replaceWith(trimmedLinksTransform);
					$('a').attr('data-trackable', 'link');

					var subheaders = $('.ft-subhead')
						.attr('id', addSubheaderIds)
						.replaceWith(subheadersTransform);

					article.bodyXML = $.html();

					article.bodyXML = article.bodyXML.replace(/<\/a>\s+([,;.:])/mg, '</a>$1');
					article.mentions = getMentions(article.annotations);
					article.id = article.id.replace('http://www.ft.com/thing/', '');

					// HACK - Force the last word in the title never to be an ‘orphan’
					article.titleHTML = article.title.replace(/(.*)(\s)/, '$1&nbsp;');

					if (article.mainImage) {
						article.mainImage = article.mainImage.id.replace(/^http:\/\/api\.ft\.com\/content\//, '');
					}

					res.render('layout', {
						article: article,
						articleV1: articleV1.item,
						title: article.title,
						mainImage: article.mainImage,
						subheaders: subheaders.map(function() {
							var $subhead = $(this);

							return {
								text: $subhead.find('.ft-subhead__title').text(),
								id: $subhead.attr('id')
							};
						}).get(),
						showTOC: res.locals.flags.articleTOC.isSwitchedOn && subheaders.length > 2,
						// if there's a video or sideshow first, we overlap them on the header
						headerOverlap:
							$('> a:first-child').attr('data-asset-type') === 'video' ||
							$('> ft-paragraph:first-child > ft-slideshow:first-child').length,
						layout: 'wrapper'
					});
					break;

				case 'json':
					res.set(cacheControl);
					res.set('Content-Type: application/json');
					res.send(JSON.stringify(article, undefined, 2));
					res.end();
					break;
			}
		})
		.catch(function(err) {
			if (err instanceof fetchres.BadServerResponseError) {
				fetchres(req.params[0])
					.then(function(data) {
						res.render('layout_404', { layout: 'wrapper', url: data.item.location.uri });
					})
					.catch(function(err) {
						if (err instanceof fetchres.BadServerResponseError) {
							res.status(404).end();
						} else {
							next(err);
						}
					});
			} else {
				next(err);
			}
		});
};
