'use strict';

module.exports = (byline, authors) => {
	if (authors) {
		authors.forEach(author => {
			byline = byline.replace(
				new RegExp('\\b(' + author.name + ')\\b'),
				'<a class="article__author" href="/stream/authorsId/' + author.id + '" data-trackable="author">$1</a>'
			);
		});
	}

	return byline;
};
