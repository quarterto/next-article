'use strict';

const OShare = require('o-share');
const fetchres = require('fetchres');

function loadShareCount() {
	let shareCount = document.querySelector('.js-share-count');
	let article = document.querySelector('.article');
	let articleId = article.getAttribute('data-content-id');
	if(shareCount) {
		let url = shareCount.getAttribute('data-shared-url');
		fetch(`/article/${articleId}/social-counts?url=${url}`)
			.then(fetchres.json)
			.then(function(counts) {
				shareCount.textContent = counts.shares + ' shares';
			});
	}

}

exports.init = function() {
	var shareContainer = document.querySelector('[data-o-component=o-share]');
	if (shareContainer) {
		new OShare(shareContainer);
		loadShareCount();
	}
};
