/*global console*/

"use strict";

require('isomorphic-fetch');
var notifySaucelabs = require('notify-saucelabs');
var TEST_HOST = process.env.TEST_APP + '.herokuapp.com';
var ARTICLE_PATH = "/content/fb368c7a-c804-11e4-8210-00144feab7de";

module.exports = {
	"js-success test": function(browser) {
		console.log("Launching http://" + TEST_HOST + ARTICLE_PATH);
		browser
			.url('https://' + TEST_HOST + "/__gtg")
			// need to set the cookie with JS for IE
			.execute(
				function () {
					document.cookie = 'next-flags=ads:off; secure=true';
				}
			)
			.url('https://' + TEST_HOST + ARTICLE_PATH)
			.waitForElementPresent("html.js.js-success", 10000);
	},

	after: function(browser, done) {
		console.log("Sauce Test Results at https://saucelabs.com/tests/" + browser.sessionId);
		console.log('Updating Saucelabs...');
		notifySaucelabs({
			passed: browser.currentTest.results.failed === 0 && browser.currentTest.results.errors === 0,
			sessionId: browser.sessionId
		})
			.then(function() {
				console.info('Finished updating Saucelabs.');
				browser.end();
				done();
			})
			.catch(function(err) {
				console.error('An error has occurred');
				browser.end();
				done(err);
			});
	}



};
