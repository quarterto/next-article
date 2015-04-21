'use strict';

var Delegate = require('dom-delegate');
var fetchres = require('fetchres');
var oDate = require('o-date');

module.exports.init = function(options) {
	var uuid = options.uuid;
	var el = document.querySelector('.js-how-useful');
	if (!el) return;
	var usefulsPromise = fetchUsefuls();

	el.innerHTML = 'Was this article useful?'
		+ '&nbsp;<button class="js-how-useful__yes how-useful__button" data-trackable="yes">Yes</button>'
		+ '&nbsp;<button class="js-how-useful__no how-useful__button" data-trackable="no">No</button>'
		+ '<div class="how-useful__prompt">Answer to see what other readers value</div>';
	el.classList.add('how-useful');
	el.setAttribute('data-trackable', 'how-useful');

	var delegate = new Delegate(el);
	delegate.on('click', '.js-how-useful__yes', function() {
		el.innerHTML = '<form method="post" class="js-how-useful-why"><label for="reason">Please tell us why you found this article useful'
			+ '<br /><input name="reason" class="how-useful__reason js-how-useful__reason"/></label>'
			+ '<br /><label class="how-useful__contact-me" for="contact-me"><input type="checkbox" id="contact-me" name="contact-me" class="js-how-useful__contact-me"/>Tick the box if you would be happy for us to contact you to find out more</label>'
			+ '<input type="submit" value="Send feedback" class="how-useful__button"></form>';
	});

	delegate.on('submit', '.js-how-useful-why', function(event) {
		event.preventDefault();
		var reason = event.target.querySelector('.js-how-useful__reason');

		// hack
		var url = '/' + uuid + '/feedback/' + encodeURIComponent(reason.value) + '?contactable=' + (document.getElementById('contact-me').checked ? 'true' : 'false')
		fetch(url , { credentials: 'same-origin' });
		showUsefuls();
	});

	delegate.on('click', '.js-how-useful__no', showUsefuls);

	function fetchUsefuls() {
		return fetch('/more-on/useful', { credentials: 'same-origin' });
	}

	function showUsefuls() {
		usefulsPromise
			.then(fetchres.text)
			.then(function(data) {
				el.innerHTML = data;
				oDate.init(el);
			})
			.catch(function(err) {
				if (err instanceof fetchres.BadServerResponseError) {
					el.innerHTML = 'Thank you for your feedback';
				} else {
					console.log(err);
				}
			});
	}
};
