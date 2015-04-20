'use strict';

var fetchres = require('fetchres');
var Gallery = require('o-gallery');
var Analytics = require('next-beacon-component');

module.exports = function(els) {
	[].slice.call(els).forEach(function(el) {
		var uuid = el.getAttribute('data-uuid');
		if (uuid) {
			fetch('/embedded-components/slideshow/' + uuid, { credentials: 'same-origin' })
				.then(fetchres.text)
				.then(function(data) {
					var container = document.createElement('div');
					container.setAttribute('class', "article__gallery");
					container.innerHTML = data;
					el.parentNode.replaceChild(container, el);
					return container;
				})
				.then(function(el) {
					el.addEventListener('oGallery.itemSelect', function (ev) {
						if (ev.target.classList.contains('o-gallery--slideshow')) {
							Analytics.fire('gallery', {
								picture: ev.detail.itemID + 1,
								totalPictures: ev.target.querySelectorAll('.o-gallery__item').length
							});
						}
					});
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
