'use strict';

var denodeify = require('denodeify');
var libxslt = require('libxslt');

// HACK: Because libxslt cannot run in HTML mode ATM (<xsl:output/> is ignored)

var DOCTYPE = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
var SELF_CLOSED_TAGS = /<[^>]+?\/>/g;
var TAG_NAME = /^<(\w+)/;

function wrap(article) {
	return '<root>' + article + '</root>';
}

function unwrap(article) {
	return article.replace(/<\/?root>/g, '');
}

function removeDoctype(article) {
	return article.replace(DOCTYPE, '');
}

function fixSelfClosingTags(article) {
	return article.replace(SELF_CLOSED_TAGS, function(match) {
		var tagName = TAG_NAME.exec(match);

		// The regex could ignore these but creates 1000+ steps
		if (['br', 'hr', 'img', 'input'].indexOf(tagName) > -1) {
			return match;
		}

		return match.replace('/>', '></' + tagName[1] + '>');
	});
}

module.exports = function bigReadTransform(article) {
	var parseFile = denodeify(libxslt.parseFile);

	return parseFile(__dirname + '/../stylesheets/article.xsl').then(function(stylesheet) {
		var transformed = stylesheet.apply(wrap(article));
		return fixSelfClosingTags(removeDoctype(unwrap(transformed)));
	});
};
