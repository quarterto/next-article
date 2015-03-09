'use strict';
var setup = require('next-js-setup');
var header = require('next-header');
var authors = require('./components/authors');
var slideshow = require('./components/slideshow');
var moreOn = require('./components/more-on/main');
var messaging = require('next-messaging');
var toc = require('./components/article/toc');

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

setup.bootstrap(function (result) {
	var flags = result.flags;
	header.init();
	var uuid = document.querySelector('[data-capi-id]').getAttribute('data-capi-id');
	function clearNotification() {
		emit('notifications:remove', { uuid: uuid });
	}
	if (uuid) clearNotification();

	messaging.init();

	if (flags.get('articlesFromContentApiV2').isSwitchedOn) {
		slideshow(document.querySelectorAll('ft-slideshow'));
		authors(uuid, document.querySelector('.article__byline'));
	}

	if (flags.get('contentApiCalls').isSwitchedOn) {
		moreOn.init(flags.getAll());
	}

	if (flags.get('articlesFromContentApiV2').isSwitchedOn) {
		require('./components/video/main');
	}

	require('./components/capi2-related/main');


	toc.init(flags);
});
