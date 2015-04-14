'use strict';

var oComments = require('o-comments');

module.exports = {

	init: function (uuid, flags) {

		if (flags.get('articleComments').isSwitchedOn && document.getElementById('comments')) {
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

	}

};
