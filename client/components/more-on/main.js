'use strict';

var fetchres = require('fetchres');
var oDate = require('o-date');
var myFtUi = require('next-myft-ui');

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

var createPromise = (el, url, options = {}) => {
	// default options
	var opts = {
		renderer: null,
		removeOnFail: true
	};
	Object.assign(opts, options);
	return fetch(url, { credentials: 'same-origin' })
		.then(fetchres.text)
		.then(resp => {
			if (!resp) {
				throw new Error('No response');
			}
			if (opts.renderer) {
				opts.renderer(el, resp);
			} else {
				el.innerHTML = resp;
			}
			oDate.init(el);
		})
		.catch(function() {
			if (opts.removeOnFail) {
				el.parentNode.removeChild(el);
			}
		});
};

module.exports.init = flags => {
	var article = document.querySelector('.article');
	var articleId = article.getAttribute('data-content-id');
	var articleSources = article.getAttribute('data-content-sources');

	// If there is no articleId don't try to load related content
	// and we also only support articles available in API v1
	if (!articleId || !/v1/.test(articleSources)) {
		return;
	}

	var fetchPromises = [].concat(
		$('.js-more-on-inline').map(el => createPromise(el, '/article/' + articleId + '/story-package?count=1&view=inline')),
		$('.js-more-on').map(el => createPromise(el, '/article/' + articleId + '/story-package?count=4')),
		$('.js-more-on-topic').map(el =>
			createPromise(
				el,
				'/article/' + articleId + '/more-on?metadata-fields=' + el.getAttribute('data-metadata-fields').replace(' ', ',') + '&count=4',
				{
					renderer: (el, resp) => {
						var brandEl = el.querySelector('.n-topic[data-taxonomy="brand"]');
						if (brandEl) {
							brandEl.insertAdjacentHTML('afterend', resp);
						} else {
							el.innerHTML = resp;
						}
					},
					removeOnFail: false
				}
			)
		),
		$('.js-related').map(el => createPromise(el, '/article/' + articleId + '/' + el.getAttribute('data-taxonomy'))),
		$('.js-special-report').map(el => createPromise(el, '/article/' + articleId + '/special-report'))
	);

	return allSettled(fetchPromises)
		.then(() => {
			var moreOnContainer = document.querySelector('.article__more-on');
			myFtUi.updateUi(moreOnContainer);
		});
};
