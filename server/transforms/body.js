"use strict";

var cheerio = require('cheerio');

var replaceEllipses = require('./replace-ellipses');
var replaceHrs = require('../transforms/replace-hrs');
var relativeLinks = require('./relative-links');
var trimmedLinks = require('./trimmed-links');
var externalImages = require('./external-images');

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
	body = body.replace(/http:\/\/www\.ft\.com\/ig\//g, '/ig/');
	body = body.replace(/http:\/\/ig\.ft\.com\//g, '/ig/');

	var $ = transform(cheerio.load(body, { decodeEntities: false }), flags)
		// other transforms
		.with(externalImages)
		.with(relativeLinks)
		.with(trimmedLinks)
		.get();
	return $;
};
