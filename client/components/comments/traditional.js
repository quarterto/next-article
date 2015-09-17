'use strict';
var OComments = require('o-comments');
var trackEvent = require('../utils/tracking');

module.exports = {};
module.exports.init = function(uuid, flags) {
	if (!flags.get('articleComments') || !document.querySelector('#comments')) {
		return;
	}
	var eventData = {
		action: 'comment',
		category: 'page',
		context: {
			product: 'next',
			source: 'next-article'
		}
	};
	OComments.on('widget.renderComplete', function (ev) {
		var commentCount = ev.detail.instance.lfWidget.getCollection().attributes.numVisible;
		var commentLink = document.createElement('a');
		commentLink.setAttribute('href', '#comments');
		commentLink.setAttribute('data-trackable', 'view-comments');
		commentLink.className = 'article__actions__action article__actions__action--comments ng-meta';
		commentLink.textContent = 'Comments (' + commentCount + ')';
		document.querySelector('.article__actions').appendChild(commentLink);
	});
	OComments.on('tracking.postComment', function (ev) {
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
