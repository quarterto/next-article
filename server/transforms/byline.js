'use strict';

module.exports = (byline, authors) => {
	if (byline && authors) {
		authors.forEach(author => {
			byline = byline.replace(
				new RegExp('\\b(' + author.name + ')\\b'),
				'<a class="n-content-topic n-content-topic--link" href="/stream/authorsId/' + author.id + '" data-trackable="author">$1</a>'
			);
		});
	}

	return byline;
};
