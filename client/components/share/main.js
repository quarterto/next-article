'use strict';

const OShare = require('o-share');
const fetchres = require('fetchres');
const oOverlay = require('o-overlay');

function loadShareCount() {
	let shareCount = document.querySelector('.js-share-count');
	let article = document.querySelector('.article');
	let articleId = article.getAttribute('data-content-id');
	if(shareCount) {
		let url = shareCount.getAttribute('data-shared-url');
		if(url && url.length) {
			fetch(`/article/${articleId}/social-counts?url=${url}`, { credentials: 'same-origin' })
			.then(fetchres.json)
			.then(function(counts) {
				shareCount.textContent = `${counts.shares}  shares`;
			});
		}
	}
}

exports.init = function(flags) {

	var shareContainer = document.querySelector('[data-o-component=o-share]');

	if (shareContainer && !shareContainer.classList.contains('data-o-share--js')) {
		new OShare(shareContainer);
		loadShareCount();
	} else if(flags.flags.ftlabsurlsharing !== undefined && flags.flags.ftlabsurlsharing.state === true){
		var giftShareOverlay = document.querySelector("[data-o-overlay-gift-trigger]");

		oOverlay.init();
		new OShare();

	}

};
