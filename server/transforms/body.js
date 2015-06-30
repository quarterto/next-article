"use strict";

var cheerio = require('cheerio');

var replaceEllipses = require('./replace-ellipses');
var replaceHrs = require('../transforms/replace-hrs');
var pullQuotes = require('./pull-quotes');
var bigNumber = require('./big-number');
var relativeLinks = require('./relative-links');
var trimmedLinks = require('./trimmed-links');
var externalImg = require('./external-img');
var removeBody = require('./remove-body');
var promoBox = require('./promo-box');
var video = require('./video');
var subheaders = require('./subheaders');
// combo transforms
var bigNumberCombos = require('./big-number-combos');
var pullQuotesFollowsImage = require('./pull-quotes-follows-image');
var bigNumberFollowsImage = require('./big-number-follows-image');
var doubleImages = require('./double-images');
var subheaderPrecedingImage = require('./subheader-preceding-image');

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

	var $ = transform(cheerio.load(body, { xmlMode: true }), flags)
		// combo components
		.with(bigNumberFollowsImage)
		.with(pullQuotesFollowsImage)
		.with(bigNumberCombos)
		.with(doubleImages)
		.with(subheaderPrecedingImage)
		// other transforms
		.with(bigNumber)
		.with(externalImg)
		.with(pullQuotes)
		.with(promoBox)
		.with(video)
		.with(removeBody)
		.with(relativeLinks)
		.with(trimmedLinks)
		.with(subheaders)
		.get();

	return $;
};
