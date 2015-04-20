'use strict';

var Delegate = require('dom-delegate');
var fetchres = require('fetchres');
var oDate = require('o-date');

module.exports.init = function(options) {
	var el = document.querySelector('.js-how-useful');
	if (!el) return;
	var usefulsPromise = fetchUsefuls();

	el.innerHTML = 'Was this article useful to you?'
		+ '<button class="js-how-useful__yes how-useful__yes" data-trackable="yes">Yes</button>'
		+ '<button class="js-how-useful__no how-useful__no" data-trackable="no">No</button>';
	el.classList.add('how-useful');
	el.setAttribute('data-trackable', 'how-useful');

	var delegate = new Delegate(el);
	delegate.on('click', '.js-how-useful__yes', processUseful.bind(this, true));
	delegate.on('click', '.js-how-useful__no', processUseful.bind(this, false));

	function processUseful(useful) {
		usefulsPromise
			.then(fetchres.text)
			.then(function(data) {
				el.innerHTML = data;
				oDate.init(el);
			})
			.catch(function(err) {
				if (err instanceof fetchres.BadServerResponseError) {
					el.innerHTML = "Something went wrong&hellip; please try again later&hellip;";
				} else {
					console.log(err);
				}
			});
	}
};


function fetchUsefuls() {
	return fetch('/more-on/useful', {
		credentials: 'same-origin'
	})
}
