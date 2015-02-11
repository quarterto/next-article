/*global fetch*/
'use strict';

var articleCard = require('next-article-card-component');
var fetchres = require('fetchres');

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
};

var initAds = function(flags) {
	var called = false;
	return function() {
		if (!called && flags.ads.isSwitchedOn){
			var ads = require('next-ads-component');
			ads.init();
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
				articleCard.init(el);
			}, function() {
				el.parentNode.removeChild(el);
			}));
	});

	$('.js-on-this-topic').forEach(function(el) {
		fetchPromises.push(fetchText('/more-on/' + el.getAttribute('data-metadata-field') + '/' + el.getAttribute('data-article-id'))
			.then(function(resp) {
				el.innerHTML = resp;
				articleCard.init(el);
			}, function() {
				el.parentNode.removeChild(el);
			}));
	});

	return allSettled(fetchPromises)
		.then(initAds(flags));
};
