"use strict";

module.exports = init;

function init(el) {
	var authors = el.innerText
		.split("and")
		.map(function(person) {
			 return person.replace(/(.*)\b(?:,|in) [A-Za-z ]+$/, '$1').trim();
		});
	var byline = el.innerHTML;
	authors.forEach(function(author) {
		byline = byline.replace(author, '<a href="/stream/authors/' + author + '">'+ author + '</a>');
	});
	el.innerHTML = byline;
}
