'use strict';

var fetchres = require('fetchres');
var oExpander = require('o-expander');

module.exports.init = function() {

	var isFromMyFT = document.location.hash.indexOf('myft') > 0;
	var isFromEmail = isFromMyFT && document.location.hash.indexOf('email') > 0;

	// HACK: we often lose the hash in redirects, but if the user hasn't come here from another page
	// we guess they came from email - otherwise we won't show the feature to enough users to draw
	// any conclusions
	var getsReadingList = isFromEmail || history.length === 1;

	var hasSession = document.cookie.match(/FTSession=/);

	if(!getsReadingList || !hasSession) {
		return;
	}
	// TODO: service worker for offline
	// TODO: caching - could we allow a long browser cache when e.g &cache=true and uuid in url?
	// TODO: all calls to /myft... to go into myft client too, so we can add uuid to urls?
	fetch('/myft/my-news?fragment=true&source=email-reading-list&limit=30&since=-24h',{
		credentials: 'same-origin'
	})
	.then(fetchres.text)
	.then(function(html) {
		if(html && html.length) {
			var container = document.querySelector('.js-myft-reading-list');
			container.querySelector('.more-on__content').insertAdjacentHTML('afterbegin', html);

			var feed = container.querySelector('.myft-feed');
			feed.classList.add('o-expander__content');

			var allLinks = [].slice.call(feed.querySelectorAll('.myft-feed__item__headline a'));

			var matchingHref = allLinks.filter(function(el) {
				return el.getAttribute('href').indexOf(document.querySelector('.article').getAttribute('data-content-id')) >= 0;
			});

			if(matchingHref.length) {
				var index = allLinks.indexOf(matchingHref[0]);
				matchingHref[0].classList.add('myft-reading-list__current-page');

				var nextArticle = allLinks[index+1];
				if(nextArticle) {
					var nextArticleCTA = document.querySelector('.myft-reading-list__title');
					nextArticleCTA.href = nextArticle.href;
					nextArticleCTA.querySelector('.myft-reading-list__title-text').textContent = 'Continue reading your daily digest';
					nextArticleCTA.insertAdjacentHTML('beforeend', '<span class="myft-reading-list__next-headline">' + nextArticle.textContent + '</span>');
				}
			}

			oExpander.init(container, {
				shrinkTo: 0,
				collapsedToggleText: 'Show full list',
				expandedToggleText: 'Show less'
			});

			container.classList.add('myft-reading-list__loaded');
		}
	});
};
