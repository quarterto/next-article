'use strict';

var fetchres = require('fetchres');
var oDate = require('o-date');

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
		if (!called && flags.get('ads').isSwitchedOn){
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
	return fetch(url)
		.then(fetchres.text)
		.then(function(resp) {
			el.innerHTML = resp;
			oDate.init(el);
		}, function() {
			el.parentNode.removeChild(el);
		});
};

module.exports.init = function(flags){
	var fetchPromises = [];
	var articleId = document.querySelector('.article').getAttribute('data-capi-id');

	$('.js-more-on-inline').forEach(function(el) {
		fetchPromises.push(createPromise(el, '/more-on/' + articleId + '?count=1&view=inline'));
	});

	$('.js-more-on').forEach(function(el) {
		fetchPromises.push(createPromise(el, '/more-on/' + articleId + '?count=4'));
	});

	$('.js-more-on-topic').forEach(function(el) {
		fetchPromises.push(createPromise(el, '/more-on/' + el.getAttribute('data-metadata-field') + '/' + articleId));
	});

	return allSettled(fetchPromises)
		.then(initAds(flags));
};
