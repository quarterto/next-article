'use strict';

var denodeify = require('denodeify');
var libxslt = require('libxslt');

module.exports = function bigReadTransform(article) {
	var parseFile = denodeify(libxslt.parseFile);

	return parseFile(__dirname + '/../stylesheets/article.xsl').then(function(stylesheet) {
		return stylesheet.apply(article).replace('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>', '');
	});
};
