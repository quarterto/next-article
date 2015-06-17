/*global console*/

"use strict";

require('es6-promise').polyfill();
require('isomorphic-fetch');
var notifySaucelabs = require('notify-saucelabs');
var ARTICLE_PATH = "/fb368c7a-c804-11e4-8210-00144feab7de";

module.exports = {
	"js-success test": function(browser) {
		console.log("Launching http://" + browser.launch_url + ARTICLE_PATH);
		browser
			.url('https://' + browser.launch_url + "/__gtg")
			.setCookie({ name: 'next-flags', domain: browser.launch_url, value: 'ads:off', secure: true })
			.url('https://' + browser.launch_url + ARTICLE_PATH)
			.waitForElementPresent("html.js.js-success", 60000)
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
