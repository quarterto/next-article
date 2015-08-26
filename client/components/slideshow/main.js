'use strict';

var fetchres = require('fetchres');
var Gallery = require('o-gallery');
var trackEvent = require('../utils/tracking');

module.exports = function(els) {
	[].slice.call(els).forEach(function(el) {
		var uuid = el.getAttribute('data-uuid');
		var syncid = el.getAttribute('data-syncid');
		if (uuid) {
			var picturesSeen = [];
			var totalPictures;
			var fireBeacon = function (picture) {
				if (picturesSeen.indexOf(picture) > -1) {
					return;
				}
				picturesSeen.push(picture);
				var data = {
					action: 'gallery',
					category: 'page',
					meta: {
						picture: picture,
						totalPictures: totalPictures,
						percentageThrough: (100 / totalPictures) * (picturesSeen.length + 1)
					},
					context: {
						product: 'next',
						source: 'next-article'
					}
				};
				trackEvent(data);
			};
			fetch('/embedded-components/slideshow/' + uuid + '?syncid=' + syncid, { credentials: 'same-origin' })
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
							fireBeacon(ev.detail.itemID + 1);
						}
					});
					el.addEventListener('oGallery.ready', function (ev) {
						totalPictures = ev.target.querySelectorAll('.o-gallery__item').length;
						fireBeacon(1);
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
