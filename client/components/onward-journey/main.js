'use strict';

var fetchres = require('fetchres');
var oDate = require('o-date');

// Sort of like Promise.all but will be called whether they fail or succeed
function allSettled(promises) {
	var resolveWhenSettled = function(promise) {
		return new Promise(res => {
			promise.then(res, () => res());
		});
	};
	return Promise.all(promises.map(resolveWhenSettled));
}

var $ = selector => [].slice.call(document.querySelectorAll(selector));

function createPromise(el, url) {
	return fetch(url, { credentials: 'same-origin' })
		.then(fetchres.text)
		.then(resp => {
			if (!resp) {
				throw new Error('No response');
			}
			el.innerHTML = resp;
			oDate.init(el);
		})
		.catch(() => {});
}

module.exports.init = function() {
	var articleEl = document.querySelector('.article');
	var dehydratedMetadata = document.getElementById('dehydrated-metadata');

	if (!articleEl || !dehydratedMetadata) {
		return;
	}

	var articleId = articleEl.getAttribute('data-content-id');
	var articleSources = articleEl.getAttribute('data-content-sources');

	// If there is no articleId don't try to load related content
	// and we also only support articles available in API v1
	if (!articleId || !/v1/.test(articleSources)) {
		return;
	}

	var fetchPromises = [];

	var hydratedMetadata = JSON.parse(dehydratedMetadata.innerHTML);
	var storyPackageIds = hydratedMetadata.package.map(article => article.id);
	var primarySection = hydratedMetadata.primarySection && hydratedMetadata.primarySection.term;

	if (storyPackageIds.length) {
		let url = `/article/${articleId}/story-package?ids=${storyPackageIds.join()}`;

		fetchPromises = fetchPromises.concat(
			$('.js-story-package-inline').map(el => createPromise(el, `${url}&view=inline&count=1`)),
			$('.js-story-package').map(el => createPromise(el, `${url}&count=4`))
		);
	}

	if (primarySection.taxonomy === 'specialReports') {
		let url = `/article/${articleId}/special-report?specialReportId=${encodeURI(primarySection.id)}&count=5`;

		fetchPromises = fetchPromises.concat(
			$('.js-special-report').map(el => createPromise(el, url))
		);
	}

	var moreOns = $('.js-more-on');

	if (moreOns.length) {
		let url = `/article/${articleId}/more-on?count=6`;

		fetchPromises = fetchPromises.concat(
			moreOns.map(el => {
				let prop = el.getAttribute('data-metadata-fields');
				let term = hydratedMetadata[prop].term;
				let query = `moreOnId=${encodeURI(term.id)}&moreOnTaxonomy=${term.taxonomy}`;
				return createPromise(el, `${url}&${query}`);
			})
		);
	}

	return allSettled(fetchPromises);
};
