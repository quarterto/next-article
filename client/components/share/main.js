'use strict';

const OShare = require('o-share');
const fetchres = require('fetchres');
const oOverlay = require('o-overlay');

let shares;

document.body.addEventListener("oOverlay.destroy", function() {
    shares.forEach(function(share) {
        share.destroy();
    });
});

document.body.addEventListener("oOverlay.ready", function() {
	console.log("\n\nOVERLAY READY\n\n");
    shares = OShare.init();
});


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

	console.log(flags.flags.ftlabsurlsharing);
	console.log(flags.flags.ftlabsurlsharing.state);

	if (shareContainer && !shareContainer.classList.contains('data-o-share--js')) {
		new OShare(shareContainer);
		loadShareCount();
	} else if(flags.flags.ftlabsurlsharing !== undefined && flags.flags.ftlabsurlsharing.state === true){

		oOverlay.init();
		OShare.addShareCodeToUrl();

	}

};
