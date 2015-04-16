'use strict';

var fetchres = require('fetchres');
var Gallery = require('o-gallery');
var Analytics = require('next-beacon-component');

module.exports = function(els) {
	[].slice.call(els).forEach(function(el) {
		var uuid = el.getAttribute('data-uuid');
		if (uuid) {
			fetch('/embedded-components/slideshow/' + uuid)
				.then(fetchres.text)
				.then(function(data) {
					var container = document.createElement('div');
					container.setAttribute('class', "article__gallery");
					container.innerHTML = data;
					el.parentNode.replaceChild(container, el);
					return container;
				})
				.then(function(el) {
					var totalItems;
					el.style.width = el.clientWidth + 'px';
					el.addEventListener('oGallery.itemSelect', function (ev) {
						if (ev.target.classList.contains('o-gallery--slideshow')) {
							Analytics.fire('galleries', { item: ev.detail.itemID, totalItems: totalItems, interacted: true });
						}
					});
					el.addEventListener('oGallery.ready', function oGalleryIsReady(ev) {
						if (ev.target.classList.contains('o-gallery--slideshow')) {
							el.removeEventListener(ev.type, oGalleryIsReady);
							totalItems = ev.target.querySelectorAll('.o-gallery__item').length;
							Analytics.fire('galleries', { item: 0, totalItems: totalItems, interacted: false });
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
