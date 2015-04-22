'use strict';

var oViewport = require('o-viewport');
var oDate = require('o-date');
var myFtClient = require('next-myft-client');

var setup = require('next-js-setup');
var header = require('next-header');
var messaging = require('next-messaging');
var video = require('next-video');

var slideshow = require('./components/slideshow/main');
var moreOn = require('./components/more-on/main');
var toc = require('./components/toc/main');
var comments = require('./components/comments/main');

// temporary
var howUseful = require('./components/how-useful/main');

oViewport.listenTo('resize');

setup.bootstrap(function(result) {
	var flags = result.flags;
	header.init(flags);

	if (document.querySelector('*[data-article-status="error"]')) {
		return;
	}

	var uuid = document.querySelector('article[data-content-id]').getAttribute('data-content-id');
	if (uuid) {
		if (flags.get('userPreferencesAPI')) {
			myFtClient.notifications.clear([uuid]);
		}
	}

	messaging.init();

	slideshow(document.querySelectorAll('ft-slideshow'));

	if (flags.get('contentApiCalls')) {
		moreOn.init(flags);
	}

	require('./components/video/main').init()
		.then(function () {
			// so far next-video only adds analytics
			// eventually most of the brightcove bit of video component will go in here
			video.init();
		});

	toc.init(flags);
	comments.init(uuid, flags);
	oDate.init(document.querySelector('.article'));
});
