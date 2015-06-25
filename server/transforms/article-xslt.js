'use strict';

var denodeify = require('denodeify');
var libxslt = require('bbc-xslt');

// HACK: Because libxslt cannot run in HTML mode ATM (<xsl:output/> is ignored)

function wrap(article) {
	return '<root>' + article + '</root>';
}

function unwrap(article) {
	return article.replace(/<\/?root>/g, '');
}

module.exports = function bigReadTransform(article) {
	var parseFile = denodeify(libxslt.parseFile);

	return parseFile(__dirname + '/../stylesheets/article.xsl').then(function(stylesheet) {
		var transformed = stylesheet.apply(wrap(article));
		return unwrap(transformed);
	});
};
