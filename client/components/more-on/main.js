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


module.exports.init = function(flags){
	var fetchPromises = [];

	$('.js-more-on').forEach(function(el) {
		fetchPromises.push(fetch('/more-on/' + el.getAttribute('data-article-id'))
			.then(fetchres.text)
			.then(function(resp) {
				el.innerHTML = resp;
				oDate.init(el);
			}, function() {
				el.parentNode.removeChild(el);
			}));
	});

	var inlineRelatedAnchor = document.querySelector('.js-more-on-inline');
	if (inlineRelatedAnchor) {
		fetchPromises.push(fetch('/more-on/' + document.querySelector('.article').getAttribute('data-capi-id') + '?count=1&view=inline')
			.then(fetchres.text)
			.then(function(resp) {
				inlineRelatedAnchor.innerHTML = resp;
				oDate.init(el);
			}, function() {
				inlineRelatedAnchor.parentNode.removeChild(inlineRelatedAnchor);
			}));
	}

	$('.js-on-this-topic').forEach(function(el) {
		fetchPromises.push(fetch('/more-on/' + el.getAttribute('data-metadata-field') + '/' + el.getAttribute('data-article-id'))
			.then(fetchres.text)
			.then(function(resp) {
				el.innerHTML = resp;
				oDate.init(el);
			}, function() {
				el.parentNode.removeChild(el);
			}));
	});

	return allSettled(fetchPromises)
		.then(initAds(flags));
};
