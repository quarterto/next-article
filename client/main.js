'use strict';

require('next-js-setup').bootstrap(function(result) {
	var oViewport = require('o-viewport');
	var oDate = require('o-date');
	var nMyFtTray = require('n-myft-tray');
	var oExpander = require('o-expander');

	var headerFooter = require('n-header-footer');
	var nVideo = require('n-video');
	// Require n-image to load pollyfill
	require('n-image');
	var nAds = require('next-ads-component');

	var slideshow = require('./components/slideshow/main');
	var moreOn = require('./components/more-on/main');
	var toc = require('./components/toc/main');
	var comments = require('./components/comments/main');
	var share = require('./components/share/main');
	var readingList = require('./components/reading-list/main');
	var readingHistory = require('./components/reading-history');
	var scrollDepth = require('./components/article/scroll-depth');
	var typogSwitcher = require('./components/typography-switcher/main');

	oViewport.listenTo('resize');

	var flags = result.flags;
	headerFooter.init(flags);

	if (document.querySelector('*[data-article-status="error"]')) {
		return;
	}

	var uuid = document.querySelector('article[data-content-id]').getAttribute('data-content-id');
	if (uuid) {
		if (flags.get('userPreferencesAPI')) {
			document.addEventListener('myft.followed.load', function(ev) {
				if (flags.get('myFTReadingListOnArticle')) {
					readingList.init();
				}
			});
		}
		readingHistory.add(uuid);
	}

	nAds.init(flags);
	slideshow(document.querySelectorAll('.article ft-slideshow'));

	if (flags.get('contentApiCalls')) {
		moreOn.init(flags);
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

	window.addEventListener("load", function (event) {
		comments.init(uuid, flags);
	},false);
});
