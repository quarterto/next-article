"use strict";

var cheerio = require('cheerio');

var replaceEllipses = require('./replace-ellipses');
var replaceHrs = require('../transforms/replace-hrs');
var relativeLinks = require('./relative-links');
var trimmedLinks = require('./trimmed-links');
var externalImg = require('./external-img');
var removeBody = require('./remove-body');
var promoBox = require('./promo-box');

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
	body = body.replace(/http:\/\/www\.ft\.com\/ig\//g, 'https://ig-next.ft.com/');
	body = body.replace(/http:\/\/ig\.ft\.com\//g, 'https://ig-next.ft.com/');

	var $ = transform(cheerio.load(body, { xmlMode: true }), flags)
		// other transforms
		.with(externalImg)
		.with(promoBox)
		.with(removeBody)
		.with(relativeLinks)
		.with(trimmedLinks)
		.get();

	return $;
};
