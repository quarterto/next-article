'use strict';

module.exports = (byline, authors) => {
	if (byline && authors) {
		authors.forEach(author => {
			byline = byline.replace(
				new RegExp('\\b(' + author.name + ')\\b'),
				'<a class="n-content-tag n-content-tag--link" href="/stream/authorsId/' + author.id + '" data-trackable="author">$1</a>'
			);
		});
	}

	return byline;
};
