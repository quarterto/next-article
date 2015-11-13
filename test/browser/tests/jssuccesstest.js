/*eslint no-console: 0*/
'use strict';

require('isomorphic-fetch');
const notifySaucelabs = require('notify-saucelabs');
const TEST_BASE_URL = `https://${process.env.TEST_APP}.herokuapp.com`;
const TEST_URL = `${TEST_BASE_URL}/content/fb368c7a-c804-11e4-8210-00144feab7de`;

module.exports = {
	'js-success test': browser => {
		console.log(`Launching ${TEST_URL}`);
		browser
			.url(`${TEST_BASE_URL}/__gtg`)
			// need to set the cookie with JS for IE
			.execute(() => {
				document.cookie = 'next-flags=ads%3Aoff; secure=true';
			})
			.url(TEST_URL)
			.waitForElementPresent('html.js-success', 60000);
	},

	tearDown: function(done) {
		const sessionId = this.client.sessionId;
		// NOTE: need to end session here so we can access the sessionId
		this.client.end();
		console.log(`Sauce Test Results at https://saucelabs.com/tests/${sessionId}`);
		console.log('Updating Saucelabs...');
		notifySaucelabs({
			sessionId: sessionId,
			passed: this.results.failed === 0 && this.results.errors === 0
		})
			.then(() => {
				console.info('Finished updating Saucelabs.');
				done();
			})
			.catch(err => {
				console.error('An error has occurred');
				done(err);
			});
	}
};
