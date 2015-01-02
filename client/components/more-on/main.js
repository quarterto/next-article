'use strict';

var articleCard = require('next-article-card-component');
var ads = require('next-ads-component');

// Sort of like Promise.all but will be called whether they fail or succeed
Promise.allSettled = function(promises){
	var resolveWhenSettled = function(promise) {
		return new Promise(function(res) {
			promise.then(res, function() {
				res();
			});
		});
	};
	return Promise.all(promises.map(resolveWhenSettled));
};

var initAds = (function(){
	var called = false;
	return function(){
		if(!called){
			ads.init();
			called = true;
		}
	};
}());

var fetchText = function(url) {
	return fetch(url)
		.then(function(response) {
			if (response.status >= 400 && response.status < 600) {
				throw new Error("Bad response from server for " + url);
			}
			return response.text();
		});
}

var $ = function (selector) {
	return [].slice.call(document.querySelectorAll(selector));
};

var fetchPromises = [];

$('.js-more-on').forEach(function (el) {
	fetchPromises.push(fetchText('/more-on/' + el.getAttribute('data-article-id'))
		.then(function (resp) {
			el.innerHTML = resp;
			articleCard.init(el);
		}, function() {
			el.parentNode.removeChild(el);
		}));
});

$('.js-on-this-topic').forEach(function (el) {
	fetchPromises.push(fetchText('/more-on/' + el.getAttribute('data-metadata-field') + '/' + el.getAttribute('data-article-id'))
		.then(function (resp) {
			el.innerHTML = resp;
			articleCard.init(el);
		}, function() {
			el.parentNode.removeChild(el);
		}));
});

Promise.allSettled(fetchPromises).then(initAds);
