'use strict';

var fetchres = require('fetchres');
var oDate = require('o-date');
var marketData = require('./market-data');
var myFtClient = require('next-myft-client');

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
var createPromise = function (el, url) {
	return fetch(url, { credentials: 'same-origin' })
		.then(fetchres.text)
		.then(function(resp) {
			if (!resp) {
				throw new Error('No response');
			}
			el.innerHTML = resp;
			oDate.init(el);
		})
		.catch(function() {
			el.parentNode.removeChild(el);
		});
};

module.exports.init = function(flags) {
	var fetchPromises = [];
	var articleId = document.querySelector('.article').getAttribute('data-content-id');

	$('.js-more-on-inline').forEach(function(el) {
		fetchPromises.push(createPromise(el, '/' + articleId + '/story-package?count=1&view=inline'));
	});
	$('.js-more-on').forEach(function(el) {
		fetchPromises.push(createPromise(el, '/' + articleId + '/story-package?count=4'));
	});
	$('.js-more-on-topic').forEach(function(el) {
		fetchPromises.push(createPromise(el, '/' + articleId + '/more-on?metadata-fields=' + el.getAttribute('data-metadata-fields').replace(' ', ',') + '&count=4'));
	});
	$('.js-related').forEach(function(el) {
		fetchPromises.push(createPromise(el, '/' + articleId + '/' + el.getAttribute('data-taxonomy')));
	});

	return allSettled(fetchPromises)
		.then(marketData)
		.then(initAds(flags))
		.then(function() {
			if(myFtClient.loaded['followed']) {
				myFtClient.emit('followed.load', myFtClient.loaded['followed']);
			}
		});
};
