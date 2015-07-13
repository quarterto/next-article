'use strict';
var fetchres = require('fetchres');

function toggleButton() {
	let el = document.querySelector('.js-myft-tray-cta');
	el.classList.toggle('is-hidden');
}

function bindButton() {
	let el = document.querySelector('.js-myft-tray-cta');
	el.addEventListener('click', function(){
		let tray = document.querySelector('.js-myft-tray');
		tray.classList.toggle('is-hidden');
	});
}

function populateFeed(stories) {
	let el = document.querySelector('.js-myft-tray-feed');
	el.innerHTML = stories;
}

module.exports.init = function() {
	fetch('/myft/my-news?fragment=true&source=my-ft-tray&limit=20',{
		credentials: 'same-origin'
	})
	.then(fetchres.text)
	.then(function(html) {
		if(html && html.length) {
			bindButton();
			toggleButton();
			populateFeed(html);
		}
	});
};
