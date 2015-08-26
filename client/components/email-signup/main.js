'use strict';

var myftClient = require('next-myft-client');

module.exports.init = function() {

	Promise.all([
		myftClient.has('preferred', 'email-daily-digest'),
		myftClient.has('preferred', 'email-weekly-digest'),
		myftClient.has('followed', '')
	])
	.then(function(results) {
		if(results[2] && !(results[0] && results[1])) {
			var topicsOnPage = [].slice.call(document.querySelectorAll('[data-concept-id]')).map(function(tag) {
				return tag.getAttribute('data-concept-id');
			});
			var followedTopics = myftClient.loaded['followed'].Items;
			var followedTopicOfThisArticle = followedTopics.filter(function(topic) {
				return topicsOnPage.indexOf(topic.UUID) >= 0;
			});

			if(followedTopicOfThisArticle.length) {
				var signup = document.querySelector('.js-myft-email-signup');

				['daily', 'weekly'].forEach(function(type) {
					var label = signup.querySelector('[data-preference-name="email-' + type + '-digest"] label');
					var message = label.textContent.replace('topics you follow', '');
					followedTopicOfThisArticle.forEach(function(topic, index) {
						var topicName = topic.Meta && topic.Meta.S && topic.Meta.S.indexOf('{' === 0) ?
							'<b>' + JSON.parse(topic.Meta.S).name + '</b>' : '';
						if(index > 0 && topicName.length) {
							topicName = ', <b>' + topicName + '</b>';
						}
						if(index === (followedTopicOfThisArticle.length - 1)){
							topicName += ' and other';
						}
						message += topicName;
					});
					label.innerHTML = message + ' topics you follow.';
				});
				signup.classList.add('myft-email-signup__loaded');

			}

		}
	}).catch(function(err) {
		setTimeout(function() {
			throw err;
		});
	});


};
