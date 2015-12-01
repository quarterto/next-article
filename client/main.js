'use strict';

require('next-js-setup').bootstrap(result => {

	const myFtClient = require('next-myft-client');
	const myFtUi = require('next-myft-ui');

	const prompts = require('n-message-prompts');
	const oViewport = require('o-viewport');
	const oDate = require('o-date');
	const nMyFtTray = require('n-myft-tray');
	const oExpander = require('o-expander');

	const layout = require('n-layout');
	const nVideo = require('n-video');

	const slideshow = require('./components/slideshow/main');
	const onwardJourney = require('./components/onward-journey/main');
	const toc = require('./components/toc/main');
	const comments = require('./components/comments/main');
	const share = require('./components/share/main');
	const readingHistory = require('./components/reading-history');
	const scrollDepth = require('./components/article/scroll-depth');

	const labsShare = require('./components/labsshare/main');

	prompts.init();
	oViewport.listenTo('resize');

	const flags = result.flags;
	layout.init(flags);

	let clientOpts = [];
	result.flags.get('follow') && clientOpts.push({relationship: 'followed', type: 'concept'});
	result.flags.get('saveForLater') && clientOpts.push({relationship: 'saved', type: 'content'});
	myFtClient.init(clientOpts);

	myFtUi.init({anonymous: !(/FTSession=/.test(document.cookie))});

	if (document.querySelector('*[data-article-status="error"]')) {
		return;
	}

	const uuid = document.querySelector('article[data-content-id]').getAttribute('data-content-id');
	if (uuid) {
		readingHistory.add(uuid);
	}

	slideshow(document.querySelectorAll('.article ft-slideshow'));

	if (flags.get('contentApiCalls')) {
		onwardJourney.init(flags);
	}

	if (flags.get('articleShareButtons')) {

		if(flags.get('ftlabsurlsharing')){
			labsShare.init();
		} else {
			share.init();			
		}

	}

	if (flags.get('myFTTray')) {
		nMyFtTray.init(flags);
	}

	nVideo.init({
		optimumWidth: 710,
		placeholder: true,
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

	window.addEventListener('load', () => {
		comments.init(uuid, flags);
	}, false);
});
