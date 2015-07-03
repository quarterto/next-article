'use strict';

var fetchres = require('fetchres');
var oExpander = require('o-expander');
var myftClient = require('next-myft-client');
var card = require('next-card');

module.exports.init = function() {

	var isFromMyFT = document.location.hash.indexOf('myft') > 0;
	var isFromEmail = isFromMyFT && document.location.hash.indexOf('email') > 0;

	// HACK: we often lose the hash in redirects, but if the user hasn't come here from another page
	// we guess they came from email - otherwise we won't show the feature to enough users to draw
	// any conclusions
	var getsReadingList = isFromMyFT || history.length === 1;

	var hasSession = document.cookie.match(/FTSession=/);

	Promise.all([
		myftClient.has('preferred', 'email-daily-digest'),
		myftClient.has('followed', '')
	])
	.then(function(results) {
		if(results[1] && !results[0]) {
			document.querySelector('.js-myft-email-signup').classList.add('myft-reading-list__loaded');
		}
	});


	if(!hasSession || !getsReadingList) {
		return;
	}

	var since = '-24h';
	var timeStamp = document.querySelector('.article__timestamp');
	if(timeStamp) {
		var hoursDifference = Math.ceil((new Date() - new Date(timeStamp.getAttribute('datetime'))) / (1000 * 3600));
		since = -Math.max(Math.min(hoursDifference + 24, 168) , 24) + 'h';
	}
	// TODO: service worker for offline
	// TODO: caching - could we allow a long browser cache when e.g &cache=true and uuid in url?
	// TODO: all calls to /myft... to go into myft client too, so we can add uuid to urls?
	fetch('/myft/my-news?fragment=true&source=email-reading-list&limit=80&since=' + since,{
		credentials: 'same-origin'
	})
	.then(fetchres.text)
	.then(function(html) {
		if(html && html.length) {
			var container = document.querySelector('.js-myft-reading-list');
			container.querySelector('.more-on__content').insertAdjacentHTML('afterbegin', html);

			var feed = container.querySelector('.myft-feed');
			feed.classList.add('o-expander__content');

			var allLinks = [].slice.call(feed.querySelectorAll('.next-card__headline__link'));

			var matchingHref = allLinks.filter(function(el) {
				return el.getAttribute('href').indexOf(document.querySelector('.article').getAttribute('data-content-id')) >= 0;
			});

			if(matchingHref.length) {
				var index = allLinks.indexOf(matchingHref[0]);
				matchingHref[0].classList.add('myft-reading-list__current-page');

				var nextArticle = allLinks[index+1];
				var nextArticleCTA = document.querySelector('.myft-reading-list__title');

				if(nextArticle) {
					nextArticleCTA.href = nextArticle.href;
					nextArticleCTA.querySelector('.myft-reading-list__title-text').textContent = isFromEmail ? 'Continue reading your daily digest' : 'Continue reading your personalised news feed';
					nextArticleCTA.insertAdjacentHTML('beforeend', '<span class="myft-reading-list__next-headline">' + nextArticle.textContent + '</span>');
				}
			}

			oExpander.init(container, {
				shrinkTo: 0,
				collapsedToggleText: 'Show full list',
				expandedToggleText: 'Show less'
			});

			if(isFromEmail) {
				container.classList.add('myft-reading-list--from-email');
			}
			card.init(container);

			container.classList.add('myft-reading-list__loaded');
		}
	});
};
