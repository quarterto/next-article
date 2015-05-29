'use strict';

var oViewport = require('o-viewport');
var oDate = require('o-date');
var myFtClient = require('next-myft-client');

var setup = require('next-js-setup');
var headerFooter = require('n-header-footer');
var nVideo = require('n-video');

var slideshow = require('./components/slideshow/main');
var moreOn = require('./components/more-on/main');
var toc = require('./components/toc/main');
var comments = require('./components/comments/main');

oViewport.listenTo('resize');

setup.bootstrap(function(result) {
	var flags = result.flags;
	headerFooter.init(flags);

	if (document.querySelector('*[data-article-status="error"]')) {
		return;
	}

	var uuid = document.querySelector('article[data-content-id]').getAttribute('data-content-id');
	if (uuid) {
		if (flags.get('userPreferencesAPI')) {
			myFtClient.notifications.clear([uuid]);
		}
	}

	slideshow(document.querySelectorAll('.article ft-slideshow'));

	if (flags.get('contentApiCalls')) {
		moreOn.init(flags);
	}

	nVideo.init({ optimumWidth: 710 })
		.then(function(videos) {
			videos.forEach(function (video) {
				video.el.className = 'article__video ng-media';
			});
		});
	toc.init(flags);
	comments.init(uuid, flags);
	oDate.init(document.querySelector('.article'));
});
