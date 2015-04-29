/*global console*/
"use strict";

require('es6-promise').polyfill();
require('isomorphic-fetch');

module.exports = {
	"js-success test": function(browser) {
		console.log('Testing host: ', browser.launch_url);
		browser
			.url(browser.launch_url)
			.waitForElementPresent("html.js.js-success", 30000)
			.end();
	},
	tearDown: function(callback) {
		console.log("Sauce Test Results at https://saucelabs.com/tests/" + this.client.sessionId);
		console.log('Updaing Saucelabs...');
		fetch('https://saucelabs.com/rest/v1/' + this.client.options.username + '/jobs/' + this.client.sessionId, {
			method: 'PUT',
			headers: {
				'Authorization': 'Basic ' + new Buffer(this.client.options.username + ':' + this.client.options.accessKey).toString('base64'),
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				passed: (this.results.failed === 0) ? true : false
			})
		})
			.then(function() {
				console.info('Finished updating Saucelabs.');
				callback();
			})
			.catch(function(err) {
				console.error('An error has occurred');
				callback(err);
			});
	}
};
