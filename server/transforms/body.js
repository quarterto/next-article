"use strict";

const cheerio = require('cheerio');

const replaceEllipses = require('./replace-ellipses');
const replaceHrs = require('../transforms/replace-hrs');
const relativeLinks = require('./relative-links');
const trimmedLinks = require('./trimmed-links');
const externalImages = require('./external-images');

let transform = function ($, flags) {
	let withFn = function ($, transformFn) {
		let transformed$ = transformFn($, flags);
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

module.exports = function (body, flags) {
	body = replaceEllipses(body);
	body = replaceHrs(body);
	body = body.replace(/<\/a>\s+([,;.:])/mg, '</a>$1');
	body = body.replace(/http:\/\/www\.ft\.com\/ig\//g, '/ig/');
	body = body.replace(/http:\/\/ig\.ft\.com\//g, '/ig/');

	let $ = transform(cheerio.load(body, { decodeEntities: false }), flags)
		// other transforms
		.with(externalImages)
		.with(relativeLinks)
		.with(trimmedLinks)
		.get();


	let tocHtml = $('.article__toc').remove();
	let mainImageHtml;

	// find image that is the first element in the body
	if ($('figure.article-image--full, figure.article-image--center').first().html() &&
	$('figure.article-image--full, figure.article-image--center').first().prev().html() === null) {
		mainImageHtml = $('figure.article-image--full, figure.article-image--center').first().remove();
	}

	let resultObject = {
		mainImageHtml: mainImageHtml,
		tocHtml: tocHtml
	};

	resultObject.bodyHtml = $.html();

	return resultObject;
};
