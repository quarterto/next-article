'use strict';
const OComments = require('o-comments');
const trackEvent = require('../utils/tracking');

module.exports = {};
module.exports.init = function(uuid, flags) {
	if (!flags.get('articleComments') || !document.querySelector('#comments')) {
		return;
	}
	const eventData = {
		action: 'comment',
		category: 'page',
		context: {
			product: 'next',
			source: 'next-article'
		}
	};
	OComments.on('widget.renderComplete', function (ev) {
		const commentCount = ev.detail.instance.lfWidget.getCollection().attributes.numVisible;
		const articleShareList = document.querySelectorAll('.article__share');
		const articleShareArray = Array.prototype.slice.call(articleShareList);
		articleShareArray.forEach(function (articleShare) {
			let commentLink = document.createElement('a');
			commentLink.setAttribute('href', '#comments');
			commentLink.setAttribute('data-trackable', 'view-comments');
			commentLink.className = 'article__share__comments';
			commentLink.textContent = commentCount;
			articleShare.appendChild(commentLink);
		});
	});
	OComments.on('tracking.postComment', function () {
		eventData.meta = { interaction: 'posted' };
		trackEvent(eventData);
	});
	OComments.on('tracking.likeComment', function (ev) {
		eventData.meta = { interaction: 'liked', id: ev.detail.data.lfEventData.targetId };
		trackEvent(eventData);
	});
	OComments.on('tracking.shareComment', function (ev) {
		eventData.meta = { interaction: 'shared', id: ev.detail.data.lfEventData.targetId };
		trackEvent(eventData);
	});

	new OComments(document.querySelector('#comments'), {
		title: document.title,
		url: document.location.href,
		articleId: uuid, // NOTE: to test, use '3a499586-b2e0-11e4-a058-00144feab7de'
		livefyre: {
			initialNumVisible: 10,
			disableIE8Shim: true,
			disableThirdPartyAnalytics: true
		}
	});
};
