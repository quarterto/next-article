'use strict';

var fetchres = require('fetchres');
var oComments = require('o-comments');
var beacon = require('next-beacon-component');

module.exports = {};
module.exports.init = function(uuid, flags) {
	if (!flags.get('articleComments') || !document.querySelector('#comments')) {
		return;
	}
	return fetch('/' + uuid + '/comments-hack', { credentials: 'same-origin' })
		.then(fetchres.json)
		.then(function(flagsOn) {
			if (!flagsOn) {
				return;
			}
			oComments.on('widget.renderComplete', function (ev) {
				var commentCount = ev.detail.instance.lfWidget.getCollection().attributes.numVisible;
				var commentLink = document.createElement('a');
				commentLink.setAttribute('href', '#comments');
				commentLink.setAttribute('data-trackable', 'view-comments');
				commentLink.className = 'article__actions__action article__actions__action--comments ng-meta ng-title-link';
				commentLink.textContent = 'Comments (' + commentCount + ')';
				document.querySelector('.article__actions').appendChild(commentLink);
			});
			oComments.on('tracking.postComment', function (ev) {
				beacon.fire('comment', { interaction: 'posted' });
			});
			oComments.on('tracking.likeComment', function (ev) {
				beacon.fire('comment', { interaction: 'liked', id: ev.detail.data.lfEventData.targetId });
			});
			oComments.on('tracking.shareComment', function (ev) {
				beacon.fire('comment', { interaction: 'shared', id: ev.detail.data.lfEventData.targetId });
			});

			var oCommentComponent = new oComments(document.querySelector('#comments'), {
			    title: document.title,
			    url: document.location.href,
			    articleId: uuid, // NOTE: to test, use '3a499586-b2e0-11e4-a058-00144feab7de'
			    livefyre: {
						initialNumVisible: 10,
						disableIE8Shim: true,
						disableThirdPartyAnalytics: true
			    }
			});

			// oCommentComponent.load();
		})
		.catch(function (err) {
			setTimeout(function () {
				throw err;
			});
		});
};
