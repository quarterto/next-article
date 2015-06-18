'use strict';

var fetchres = require('fetchres');
var oDate = require('o-date');
var nTopic = require('n-topic');
var myFtUi = require('next-myft-ui');

// Sort of like Promise.all but will be called whether they fail or succeed
function allSettled(promises) {
	var resolveWhenSettled = function(promise) {
		return new Promise(function(res) {
			promise.then(res, function() {
				res();
			});
		});
	};
	return Promise.all(promises.map(resolveWhenSettled));
}
var initAds = function(flags) {
	var called = false;
	return function() {
		if (!called && flags.get('ads')){
			var ads = require('next-ads-component');
			ads.init(flags);
			called = true;
		}
	};
};
var $ = function(selector) {
	return [].slice.call(document.querySelectorAll(selector));
};
var createPromise = function (el, url, renderer) {
	return fetch(url, { credentials: 'same-origin' })
		.then(fetchres.text)
		.then(function(resp) {
			if (!resp) {
				throw new Error('No response');
			}
			if (renderer) {
				renderer(el, resp);
			} else {
				el.innerHTML = resp;
			}
			oDate.init(el);
		})
		.catch(function() {
			el.parentNode.removeChild(el);
		});
};

module.exports.init = function(flags) {
	var fetchPromises = [];
	var articleId = document.querySelector('.article').getAttribute('data-content-id');

	// If there is no articleId don't try to load related content
	if (!articleId) {
		return;
	}

	$('.js-more-on-inline').forEach(function(el) {
		fetchPromises.push(createPromise(el, '/article/' + articleId + '/story-package?count=1&view=inline'));
	});
	$('.js-more-on').forEach(function(el) {
		fetchPromises.push(createPromise(el, '/article/' + articleId + '/story-package?count=4'));
	});
	$('.js-more-on-topic').forEach(function(el) {
		fetchPromises.push(createPromise(el, '/article/' + articleId + '/more-on?metadata-fields=' + el.getAttribute('data-metadata-fields').replace(' ', ',') + '&count=4', function (el, resp) {
			var brandEl = el.querySelector('.n-topic[data-taxonomy="brand"]');
			if (brandEl) {
				brandEl.insertAdjacentHTML('afterend', resp);
			} else {
				el.innerHTML = resp;
			}
		}));
	});
	$('.js-related').forEach(function(el) {
		fetchPromises.push(createPromise(el, '/article/' + articleId + '/' + el.getAttribute('data-taxonomy')));
	});

	return allSettled(fetchPromises)
		.then(function() {
			var moreOnContainer = document.querySelector('.article__more-on');
			nTopic.init(moreOnContainer);
			myFtUi.updateUi(moreOnContainer);
		})
		.then(initAds(flags));

};
