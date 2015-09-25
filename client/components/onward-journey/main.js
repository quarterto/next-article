'use strict';

var fetchres = require('fetchres');
var oDate = require('o-date');

// Sort of like Promise.all but will be called whether they fail or succeed
var allSettled = promises => {
	var resolveWhenSettled = function(promise) {
		return new Promise(res => {
			promise.then(res, () => res());
		});
	};
	return Promise.all(promises.map(resolveWhenSettled));
};

var $ = selector => [].slice.call(document.querySelectorAll(selector));

var createPromise = (el, url) => {
	return fetch(url, { credentials: 'same-origin' })
		.then(fetchres.text)
		.then(resp => {
			if (!resp) {
				throw new Error('No response');
			}
			el.innerHTML = resp;
			oDate.init(el);
		})
		.catch(function() {
			return;
		});
};

module.exports.init = flags => {
	var article = document.querySelector('.article');
	var articleId = article.getAttribute('data-content-id');
	var articleSources = article.getAttribute('data-content-sources');
	var dehydratedMetadata = document.getElementById('dehydrated-metadata');
	var hydratedMetadata = dehydratedMetadata && JSON.parse(dehydratedMetadata.innerHTML);
	var storyPackageIds = hydratedMetadata.package && hydratedMetadata.package.length && hydratedMetadata.package.map(function(el) {
		return el.id;
	}).join(',');
	var storyPackageQueryString = `ids=${storyPackageIds}`;
	var moreOnProperties = $('.js-more-on').map(function(el) {
		return el.getAttribute('data-metadata-fields');
	});
	var moreOnQueryStrings = moreOnProperties.map(function(prop) {
		return `moreOnId=${encodeURI(hydratedMetadata[prop].term.id)}&moreOnTaxonomy=${hydratedMetadata[prop].term.taxonomy}`;
	});

	// If there is no articleId don't try to load related content
	// and we also only support articles available in API v1
	if (!articleId || !/v1/.test(articleSources)) {
		return;
	}

	var fetchPromises = [].concat(
		storyPackageIds.length ? $('.js-story-package-inline').map(el => createPromise(el, `/article/${articleId}/story-package?count=1&view=inline&${storyPackageQueryString}`)) : Promise.resolve(),
		storyPackageIds.length ? $('.js-story-package').map(el => createPromise(el, `/article/${articleId}/story-package?count=4&${storyPackageQueryString}`)) : Promise.resolve(),
		$('.js-more-on').map((el, index) => createPromise(el, `/article/${articleId}/more-on?${moreOnQueryStrings[index]}&count=6`)),
		$('.js-special-report').map(el => createPromise(el, `/article/${articleId}/special-report`))
	);

	return allSettled(fetchPromises);
};
