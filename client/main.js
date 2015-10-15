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

	var slideshow = require('./components/slideshow/main');
	var onwardJourney = require('./components/onward-journey/main');
	var toc = require('./components/toc/main');
	var comments = require('./components/comments/main');
	var share = require('./components/share/main');
	var readingHistory = require('./components/reading-history');
	var scrollDepth = require('./components/article/scroll-depth');
	var suggestedReads = require('./components/suggested-reads/main');

	var encrypt = require('share-code-creator').encrypt;
	var session = require('ft-next-session-client');

	prompts.init();
	oViewport.listenTo('resize');

	var flags = result.flags;
	layout.init(flags);

	if (document.querySelector('*[data-article-status="error"]')) {
		return;
	}

	var uuid = document.querySelector('article[data-content-id]').getAttribute('data-content-id');
	if (uuid) {
		readingHistory.add(uuid);
	}

	slideshow(document.querySelectorAll('.article ft-slideshow'));

	if (flags.get('contentApiCalls') && !flags.get('articleSuggestedRead')) {
		onwardJourney.init(flags);
	}

	if (flags.get('articleShareButtons')) {
		share.init();
	}

	if (flags.get('myFTTray')) {
		nMyFtTray.init(flags);
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
	suggestedReads.init(flags);

	window.addEventListener('load', function() {
		comments.init(uuid, flags);
		// get uuid from session
		session.uuid().then(function(data){
			if (data) {
				var userId = data.uuid;
				var article = window.location.pathname.split('/')[2];
				history.pushState({}, '', window.location.pathname + '?share_code=' + encodeURI(encrypt(user, article)));
			}
		});
	}, false);
});
