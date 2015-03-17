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

module.exports = function(req, res, next) {
	var articleV1Promise = fetchCapiV1({
			uuid: req.params[0],
			useElasticSearch: res.locals.flags.elasticSearchItemGet.isSwitchedOn
		})

			// Some things aren't in CAPI v1 (e.g. FastFT)
			.catch(function(err) {
				if (err instanceof fetchres.BadServerResponseError) {
					return;
				} else {
					throw err;
				}
			});

	var articleV2Promise = fetchCapiV2({ uuid: req.params[0] });

	Promise.all([articleV1Promise, articleV2Promise])
		.then(function(articles) {
			var articleV1 = articles[0];
			var article = articles[1];

			res.vary(['Accept-Encoding', 'Accept']);
			res.set(cacheControl);
			switch(req.accepts(['html', 'json'])) {
				case 'html':
					var body = article.bodyXML;
					body = replaceEllipses(body);
					body = replaceHrs(body);
					body = pStrongsToH3s(body);
					var $ = cheerio.load(body);

					$('a[href*=\'#slide0\']').replaceWith(slideshowTransform);
					$('big-number').replaceWith(bigNumberTransform);
					$('img').replaceWith(externalImgTransform);
					$('ft-content').replaceWith(ftContentTransform);
					$('p').replaceWith(pHackTransform);
					$('blockquote').attr('class', 'article__block-quote o-quote o-quote--standard');
					$('pull-quote').replaceWith(pullQuotesTransform);
					$('body').replaceWith(removeBodyTransform);
					// $('img').replaceWith(function (index, el) {
					// 	return $('<figure></figure>')
					// 		.append($(el).clone());
					// });

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

					var $subheaders = $('.ft-subhead')
						.attr('id', addSubheaderIds)
						.replaceWith(subheadersTransform);

					body = $.html();

					body = body.replace(/<\/a>\s+([,;.:])/mg, '</a>$1');

					res.render('layout', {
						article: article,
						articleV1: articleV1 && articleV1.item,
						id: article.id.replace('http://www.ft.com/thing/', ''),
						// HACK - Force the last word in the title never to be an ‘orphan’
						title: article.title.replace(/(.*)(\s)/, '$1&nbsp;'),
						body: body,
						subheaders: $subheaders.map(function() {
							var $subhead = $(this);
							return {
								text: $subhead.find('.article__subhead__title').text(),
								id: $subhead.attr('id')
							};
						}).get(),
						showTOC: res.locals.flags.articleTOC.isSwitchedOn && $subheaders.length > 2,
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
