'use strict';

module.exports = function(byline, articleV1) {
	if (articleV1 && articleV1.item && articleV1.item.metadata && articleV1.item.metadata.authors) {
		articleV1.item.metadata.authors.forEach(function(author) {
			var name = author.term.name;
			byline = byline.replace(
				new RegExp('\\b(' + name + ')\\b'),
				'<a class="article__author ng-title-link" href="/stream/authorsId/' + author.term.id + '" data-trackable="author">$1</a>'
			);
		});
	}

	return byline;
};
