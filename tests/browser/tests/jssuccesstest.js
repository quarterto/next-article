/*global console*/
"use strict";

require('es6-promise').polyfill();
require('isomorphic-fetch');
var notifySaucelabs = require('notify-saucelabs');

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
		console.log('Updating Saucelabs...');
		notifySaucelabs({
			accessKey: this.client.sessionId,
			passed: this.results.failed === 0
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
