'use strict';

var fetchres = require('fetchres');
var oComments = require('o-comments');
var Analytics = require('next-beacon-component');

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
				var commentCount = ev.detail.widget.lfWidget.getCollection().attributes.numVisible;
				var commentLink = document.createElement('a');
				commentLink.setAttribute('href', '#comments');
				commentLink.setAttribute('data-trackable', 'view-comments');
				commentLink.className = 'article__actions__action article__actions__action--comments ng-meta ng-title-link';
				commentLink.textContent = 'Comments (' + commentCount + ')';
				document.querySelector('.article__actions').appendChild(commentLink);
			});
			oComments.on('tracking.postComment', function (ev) {
				console.log(ev);
				Analytics.fire('comments', { type: 'posted' });
			});
			// testing
			oComments.init({
			    "livefyre": {
			        "network": "ft-1.fyre.co",
			        "domain": "ft-1.auth.fyre.co",
			        "resourceDomainBase": "http://zor.livefyre.com"
			    },
			    dependencies: {
			        "o-comment-api": {
			            "suds": {
			                "baseUrl": "http://test.session-user-data.webservices.ft.com"
			            },
			            "ccs": {
			                "baseUrl": "http://test.comment-creation-service.webservices.ft.com"
			            },
			            "cacheConfig": {
			                "authBaseName": "comments-test-auth-",
			                "initBaseName": "comments-test-init-"
			            }
			        }
			    }
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
		})
		.catch(function (err) {
			setTimeout(function () {
				throw err;
			});
		});
};
