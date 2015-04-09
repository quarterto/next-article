'use strict';

var fetchres = require('fetchres');
var Gallery = require('o-gallery');

module.exports = function(els) {
	[].slice.call(els).forEach(function(el) {
		var uuid = el.getAttribute('data-uuid');
		if (uuid) {
			fetch('/embedded-components/slideshow/' + uuid)
				.then(fetchres.text)
				.then(function(data) {
					var container = document.createElement("div");
					container.setAttribute('class', "article__gallery");
					container.innerHTML = data;
					el.parentNode.replaceChild(container, el);
					return container;
				})
				.then(function(el) {
					el.style.width = el.clientWidth + 'px';
					return Gallery.init(el);
				})
				.catch(function(err) {
					setTimeout(function() {
						throw err;
					});
				});
		}
	});
};
