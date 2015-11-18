'use strict';

const OShare = require('o-share');
const fetchres = require('fetchres');

function loadShareCount() {
	let shareCountList = document.querySelectorAll('.js-share-count');
	let shareCountArray = Array.prototype.slice.call(shareCountList);
	let article = document.querySelector('.article');
	let articleId = article.getAttribute('data-content-id');
	if(shareCountArray.length) {
		let url = shareCountArray[0].getAttribute('data-shared-url');
		if(url && url.length) {
			fetch(`/article/${articleId}/social-counts?url=${url}`, { credentials: 'same-origin' })
			.then(fetchres.json)
			.then(function(counts) {
				shareCountArray.forEach(shareCount => shareCount.textContent = `${counts.shares} shares`);
			});
		}
	}
}

exports.init = function() {
	var shareContainer = document.querySelector('[data-o-component=o-share]');
	if (shareContainer && !shareContainer.classList.contains('data-o-share--js')) {
		new OShare(shareContainer);
		loadShareCount();
	}
};
