'use strict';
var fetchres = require('fetchres');
var oTabs = require('o-tabs');
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
	let el = document.querySelector('.js-myft-tray-cta');
	let close = document.querySelector('.js-myft-tray-close');
	el.addEventListener('click', toggle);
	close.addEventListener('click', toggle);
}


function populateFeed(stories) {
	let el = document.querySelector('.js-myft-tray-feed');
	el.innerHTML = stories;
}

function populateTopics(topics) {
	let el = document.querySelector('.js-myft-tray-topics');
	topics.Items.forEach(function(topic) {
		let topicInfo = JSON.parse(topic.Meta.S);
		let link = document.createElement('a');
		link.classList.add('myft-tray__topic');
		link.href = '/stream/' + topicInfo.taxonomy + 'Id/' + topic.UUID;
		link.textContent = topicInfo.name;
		el.appendChild(link);
	})
	el.innerHTML = topics;
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
