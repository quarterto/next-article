"use strict";

var cheerio = require('cheerio');

var replaceEllipses = require('./replace-ellipses');
var replaceHrs = require('../transforms/replace-hrs');
var pullQuotes = require('./pull-quotes');
var pullQuotesFollowsImage = require('./pull-quotes-follows-image');
var bigNumber = require('./big-number');
var bigNumberFollowsImage = require('./big-number-follows-image');
var ftContent = require('./ft-content');
var relativeLinks = require('./relative-links');
var slideshow = require('./slideshow');
var trimmedLinks = require('./trimmed-links');
var externalImg = require('./external-img');
var removeBody = require('./remove-body');
var promoBox = require('./promo-box');
var video = require('./video');
var relatedInline = require('./related-inline');
var addTracking = require('./add-tracking');

var transform = function ($, flags) {
	var withFn = function ($, transformFn) {
		var transformed$ = transformFn($, flags);
		return {
			'with': withFn.bind(withFn, transformed$),
			get: function () {
				return transformed$;
			}
		};
	};
	return {
		'with': withFn.bind(withFn, $)
	};
};

module.exports = function(body, flags) {
	body = replaceEllipses(body);
	body = replaceHrs(body);
	body = body.replace(/<\/a>\s+([,;.:])/mg, '</a>$1');

	var $ = transform(cheerio.load(body), flags)
		.with(slideshow)
		.with(bigNumberFollowsImage)
		.with(bigNumber)
		.with(externalImg)
		.with(ftContent)
		.with(pullQuotesFollowsImage)
		.with(pullQuotes)
		.with(promoBox)
		.with(video)
		.with(relatedInline)
		.with(removeBody)
		.with(relativeLinks)
		.with(trimmedLinks)
		.with(addTracking)
		.get();

	return $;
};
