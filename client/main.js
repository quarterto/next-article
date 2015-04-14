'use strict';

var oViewport = require('o-viewport');
var oDate = require('o-date');
var oComments = require('o-comments');

var setup = require('next-js-setup');
var header = require('next-header');
var messaging = require('next-messaging');

var slideshow = require('./components/slideshow/main');
var moreOn = require('./components/more-on/main');
var toc = require('./components/toc/main');
var video = require('next-video');

oViewport.listenTo('resize');

function emit(name, data) {
	var event = document.createEvent('Event');
	event.initEvent(name, true, true);
	if (data) {
		event.detail = data;
	}
	document.dispatchEvent(event);
}

setup.bootstrap(function(result) {
	var flags = result.flags;
	header.init(flags);

	if (document.querySelector('*[data-article-status="error"]')) {
		return;
	}

	var uuid = document.querySelector('[data-capi-id]').getAttribute('data-capi-id');
	function clearNotification() {
		emit('notifications:remove', { uuid: uuid });
	}
	if (uuid) clearNotification();

	messaging.init();

	slideshow(document.querySelectorAll('ft-slideshow'));

	if (flags.get('contentApiCalls').isSwitchedOn) {
		moreOn.init(flags);
	}

	require('./components/video/main').init()
		.then(function () {
			// so far next-video only adds analytics
			// eventually most of the brightcove bit of video component will go in here
			video.init();
		});

	toc.init(flags);
	oDate.init(document.querySelector('.article'));

	if (flags.get('articleComments').isSwitchedOn) {
		oComments.on('widget.renderComplete', function (ev) {
			var commentCount = ev.detail.widget.lfWidget.getCollection().attributes.numVisible;
			var commentLink = document.createElement('a');
			commentLink.setAttribute('href', '#comments');
			commentLink.setAttribute('data-trackable', 'view-comments');
			commentLink.className = 'article__actions__action article__actions__action--comments ng-meta ng-title-link';
			commentLink.textContent = 'Comments (' + commentCount + ')';
			document.querySelector('.article__actions').appendChild(commentLink);
		});
		var oCommentComponent = new oComments.Widget({
			elId: 'comments',
			title: document.title,
			url: document.location.href,
			articleId: uuid,
			initExtension: {
				initialNumVisible: 10,
				disableIE8Shim: true,
				disableThirdPartyAnalytics: true
			}
		});
		oCommentComponent.load();
	}
});
