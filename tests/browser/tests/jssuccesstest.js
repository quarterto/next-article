/* global console */

"use strict";

var https = require('https');

module.exports = {

	"Js-success Test" : function (browser) {
		console.log('Testing host', browser.launch_url+"b70cc2d6-b809-11e4-b6a5-00144feab7de");
		browser
			.url(browser.launch_url+"/b70cc2d6-b809-11e4-b6a5-00144feab7de")
			.waitForElementVisible('body', 5000)
			.assert.attributeEquals(".js", "class", " js")
			.end();
	},

	tearDown : function(callback) {
		var data = JSON.stringify({
			"passed" : (this.results.failed === 0) ? true : false
		});

		var requestPath = '/rest/v1/'+ this.client.options.username +'/jobs/' + this.client.sessionId;

		console.log("Sauce Test Results at https://saucelabs.com/tests/" + this.client.sessionId);

		try {
			console.log('Updaing Saucelabs...');
			var req = https.request({
				hostname: 'saucelabs.com',
				path: requestPath,
				method: 'PUT',
				auth : this.client.options.username + ':' + this.client.options.accessKey,
				headers : {
					'Content-Type': 'application/json',
					'Content-Length' : data.length
				}
			}, function(res) {
				res.setEncoding('utf8');
				res.on('data', function (chunk) {
				});
				res.on('end', function () {
					console.info('Finished updating Saucelabs.');
					callback();
				});
			});

			req.on('error', function(e) {
				console.log('problem with request: ' + e.message);
			});
			req.write(data);
			req.end();
		} catch (err) {
			console.log('Error', err);
			callback();
		}

	}



};
