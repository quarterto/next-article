'use strict';

require('next-js-setup').bootstrap(function(result) {

	var prompts = require('n-message-prompts');
	var oViewport = require('o-viewport');
	var oDate = require('o-date');
	var nMyFtTray = require('n-myft-tray');
	var oExpander = require('o-expander');

	var layout = require('n-layout');
	var nVideo = require('n-video');
	// Require n-image to load pollyfill
	require('n-image');
	var nAds = require('next-ads-component');

	var slideshow = require('./components/slideshow/main');
	var onwardJourney = require('./components/onward-journey/main');
	var toc = require('./components/toc/main');
	var comments = require('./components/comments/main');
	var share = require('./components/share/main');
	var emailSignup = require('./components/email-signup/main');
	var readingHistory = require('./components/reading-history');
	var scrollDepth = require('./components/article/scroll-depth');
	var typogSwitcher = require('./components/typography-switcher/main');
	var relatedToast = require('./components/related-toast/main');

	prompts.init();
	oViewport.listenTo('resize');

	var flags = result.flags;
	layout.init(flags);

	if (document.querySelector('*[data-article-status="error"]')) {
		return;
	}

	var uuid = document.querySelector('article[data-content-id]').getAttribute('data-content-id');
	if (uuid) {
		if (flags.get('userPreferencesAPI') && flags.get('myFTArticleEmailSignup')) {
			document.addEventListener('myft.followed.load', function(ev) {
				emailSignup.init();
			});
		}
		readingHistory.add(uuid);
	}

	nAds.init(flags);
	slideshow(document.querySelectorAll('.article ft-slideshow'));

	if (flags.get('contentApiCalls')) {
		onwardJourney.init(flags);
	}

	if (flags.get('articleShareButtons')) {
		share.init();
	}

	if (flags.get('myFTTray')) {
		nMyFtTray.init();
	}

	nVideo.init({
		optimumWidth: 710,
		classes: ['article__video', 'ng-media']
	});

	toc.init(flags);
	oDate.init(document.querySelector('.article'));
	oExpander.init(document.querySelector('.article'), {
		toggleSelector: 'button.o-expander__toggle',
		toggleState: 'all',
		collapsedToggleText: 'Show more',
		expandedToggleText: 'Show less'
	});
	scrollDepth.init(flags);
	typogSwitcher.init(flags);
	relatedToast.init(flags);

	window.addEventListener("load", function (event) {
		comments.init(uuid, flags);
	},false);
});
