/*global fetch*/
"use strict";

var fetchres = require('fetchres');

module.exports = function(uuid, el) {
	if (uuid && el) {
		return fetch('/' + uuid + '/authors')
			.then(fetchres.json)
			.then(function(authors) {
				var byline = el.innerHTML;
				authors.forEach(function(author) {
					byline = byline.replace(author, '<a href="/stream/authors/' + author + '">'+ author + '</a>');
				});
				el.innerHTML = byline;
			});
	}
};
