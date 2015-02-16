'use strict';
var flags = require('next-feature-flags-client');

require('isomorphic-fetch');
require('next-ui-setup');
require('next-header');
var authors = require('./components/authors');
var slideshow = require('./components/slideshow');
var moreOn = require('./components/more-on/main');
var messaging = require('next-messaging');

require('next-article-card-component');
var viewport = require('o-viewport');
viewport.listenTo('resize');

function emit(name, data) {
	var event = document.createEvent('Event');
	event.initEvent(name, true, true);
	if (data) {
		event.detail = data;
	}
	document.dispatchEvent(event);
}


function init() {
	flags.init().then(function () {
		var uuid = document.querySelector('[data-capi-id]').getAttribute('data-capi-id');
		function clearNotification() {
			emit('notifications:remove', { uuid: uuid });
		}
		if (uuid) clearNotification();

		var allFlags = flags.getAll();

		messaging.init();

		if (allFlags.articlesFromContentApiV2 && allFlags.articlesFromContentApiV2.isSwitchedOn) {
			slideshow(document.querySelectorAll('ft-slideshow'));
			authors(uuid, document.querySelector('.article__byline'));
		}

		if (allFlags.userPreferences && allFlags.userPreferences.isSwitchedOn) {
			require('next-user-preferences');
		}

		if (allFlags.contentApiCalls && allFlags.contentApiCalls.isSwitchedOn) {
			moreOn.init(allFlags);
		}

		if (allFlags.beacon && allFlags.beacon.isSwitchedOn) {
			require('next-beacon-component');
		}

		if (allFlags.articlesFromContentApiV2 && allFlags.articlesFromContentApiV2.isSwitchedOn) {
			require('./components/video/main');

			//[Re-]position mpu
			var adSlots = require('./components/ad-slots/main');
			document.addEventListener('oViewport.resize', function(){
				adSlots.placeMpu();
			});
			document.addEventListener('oViewport.orientation', function(){
				adSlots.placeMpu();
			});
			adSlots.placeMpu();
		}

		if (allFlags.streamsFromContentApiV2 && allFlags.streamsFromContentApiV2.isSwitchedOn) {
			require('./components/capi2-related/main');
		}
	});
}

if (window.ftNextInitCalled){
	init();
} else {
	document.addEventListener('polyfillsLoaded', init);
}
