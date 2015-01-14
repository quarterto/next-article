'use strict';
var flags = require('next-feature-flags-client');

require('isomorphic-fetch');
require('ft-next-wrapper');
require('next-header');
require('next-user-preferences');
require('next-article-card-component');
var Gallery = require('o-gallery');
var fetchres = require('fetchres');

var emit = function(name, data) {
	var event = document.createEvent('Event');
	event.initEvent(name, true, true);
	if (data) {
		event.detail = data;
	}
	document.dispatchEvent(event);
};

function clearNotification() {
	var uuid = document.querySelector('[data-capi-id]').getAttribute('data-capi-id');
	emit('notifications:remove', { uuid: 'Article:' + uuid });
}

clearNotification();

flags.init().then(function(){
	var allFlags = flags.getAll();

	if (allFlags.articlesFromContentApiV2 && allFlags.articlesFromContentApiV2.isSwitchedOn) {
		var href;
		[].slice.call(document.querySelectorAll('.article-card__body a[href]')).forEach(function(el) {
			href = /\/([a-f0-9-]+)\.html#slide0$/.exec(el.getAttribute('href'));
			if (el.innerHTML && href) {
				fetch('/embedded-components/slideshow/' + href[1])
					.then(fetchres.text)
					.then(function(data) {
						var container = document.createElement("div");
						container.innerHTML = data;
						el.parentNode.replaceChild(container, el);
						return container;
					})
					.then(function(el) {
						return Gallery.init(el);
					})
					.catch(function(err) {
						setTimeout(function() { console.log(err); });
					});
			}
		});
	}

	if (allFlags.contentApiCalls && allFlags.contentApiCalls.isSwitchedOn) {
		require('./components/more-on/main');
	}

	if (allFlags.beacon && allFlags.beacon.isSwitchedOn) {
		require('next-beacon-component');
	}

});
