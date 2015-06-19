"use strict";

var cheerio = require('cheerio');

var replaceEllipses = require('./replace-ellipses');
var replaceHrs = require('../transforms/replace-hrs');
var pullQuotesTransform = require('./pull-quotes');
var pullQuotesFollowsImageTransform = require('./pull-quotes-follows-image');
var bigNumberTransform = require('./big-number');
var bigNumberFollowsImageTransform = require('./big-number-follows-image');
var ftContentTransform = require('./ft-content');
var relativeLinksTransform = require('./relative-links');
var slideshowTransform = require('./slideshow');
var trimmedLinksTransform = require('./trimmed-links');
var externalImgTransform = require('./external-img');
var removeBodyTransform = require('./remove-body');
var promoBoxTransform = require('./promo-box');
var videoTransform = require('./video');

module.exports = function(body, opts) {
	var fullWidthMainImages = opts.fullWidthMainImages;
	var brightcovePlayer = opts.brightcovePlayer;

	// HACK around a bug in the content api by replacing <br></br> with <br>
	// See: http://api.ft.com/content/e80e2706-c7ec-11e4-8210-00144feab7de
	body = body.replace(/<br><\/br>/g, '<br>');
	body = replaceEllipses(body);
	body = replaceHrs(body);
	body = body.replace(/<\/a>\s+([,;.:])/mg, '</a>$1');

	var $ = cheerio.load(body);
	$('a[href$="#slide0"]').replaceWith(slideshowTransform);
	$ = bigNumberFollowsImageTransform($);
	$('big-number').replaceWith(bigNumberTransform);
	$('img').replaceWith(externalImgTransform({ fullWidthMainImages: fullWidthMainImages }));
	$('ft-content').not('[type$="ImageSet"]').replaceWith(ftContentTransform);
	$('blockquote').attr('class', 'article__block-quote o-quote o-quote--standard');
	$ = pullQuotesFollowsImageTransform($);
	$('pull-quote').replaceWith(pullQuotesTransform);
	$('promo-box').replaceWith(promoBoxTransform);
	$('a[href^="http://video.ft.com/"]:empty').replaceWith(videoTransform({ brightcovePlayer: brightcovePlayer }));

	// insert inline related
	if ($('body > p').length >= 6) {
		var paraHook = $('body > p').get(3);
		$(paraHook).after('<div class="js-more-on-inline" data-trackable="more-on-inline"></div>');
	}

	$('body').replaceWith(removeBodyTransform);
	$('a').replaceWith(relativeLinksTransform);
	$('a').replaceWith(trimmedLinksTransform);
	$('a').attr('data-trackable', 'link');

	return $;
};
