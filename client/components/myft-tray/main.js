'use strict';
var fetchres = require('fetchres');
var oTabs = require('o-tabs');
var oDate = require('o-date');
var myftClient = require('next-myft-client');

function toggleButton() {
	let el = document.querySelector('.js-myft-tray-cta');
	el.classList.toggle('is-hidden');
}

function toggle() {
	let tray = document.querySelector('.js-myft-tray');
	tray.classList.toggle('myft-tray--open');

}

function bindButton() {
	let tray = document.querySelector('.js-myft-tray');

	document.body.addEventListener('click', function(e) {
		if(	e.target.closest('.js-myft-tray-cta') ||
				e.target.closest('.js-myft-tray-close') ||
				(!e.target.closest('.js-myft-tray') && tray.classList.contains('myft-tray--open'))) {
					toggle();
		}
	});
}


function populateFeed(stories) {
	let el = document.querySelector('.js-myft-tray-feed');
	el.innerHTML = stories;
}

function populateTopics(topics) {
	let el = document.querySelector('.js-myft-tray-topics');
	topics.Items.forEach(function(topic) {
		let topicInfo = JSON.parse(topic.Meta.S);
		let link = `<li class="myft-tray__topic"><a data-trackable="topic-link" href="/stream/${topicInfo.taxonomy}Id/${topic.UUID}">${topicInfo.name}</a></li>`;
		el.insertAdjacentHTML('beforeend', link);
	});
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
			oDate.init(document.querySelector('.js-myft-tray'));
			myftClient.has('followed', '')
			.then(function(hasFollowed) {
				if(hasFollowed) {
					populateTopics(myftClient.loaded['followed']);
				}
			});

			oTabs.init();
		}
	});
};
