"use strict";

var $ = require('cheerio');

module.exports = function(byline, articleV1) {
	articleV1.item.metadata.authors.forEach(function (author) {
		var name = author.term.name;
		byline = byline.replace(
			new RegExp('\\b(' + name + ')\\b'),
			'<a class="article__author ng-title-link" href="/stream/authors/' + name + '" data-trackable="author">$1</a>'
		);
	})

	return byline;
};
