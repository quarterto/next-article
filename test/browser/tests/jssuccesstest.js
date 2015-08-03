/*global console*/

"use strict";

require('es6-promise').polyfill();
require('isomorphic-fetch');
var notifySaucelabs = require('notify-saucelabs');
var TEST_HOST = process.env.TEST_APP + '.herokuapp.com';
var ARTICLE_PATH = "/fb368c7a-c804-11e4-8210-00144feab7de";

module.exports = {
	"js-success test": function(browser) {
		console.log("Launching http://" + TEST_HOST + ARTICLE_PATH);
		browser
			.url('https://' + TEST_HOST + "/__gtg")
			.setCookie({ name: 'next-flags', domain: TEST_HOST, value: 'ads:off', secure: true })
			.url('https://' + TEST_HOST + ARTICLE_PATH)
			.waitForElementPresent("html.js.js-success", 60000)
			.end();
	},

	tearDown: function(callback) {
		console.log("Sauce Test Results at https://saucelabs.com/tests/" + this.client.sessionId);
		console.log('Updating Saucelabs...');
		notifySaucelabs({
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
