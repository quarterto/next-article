/* global console */
"use strict";

var https = require('https');

module.exports = {

	"Js-success Test" : function (browser) {
	console.log('Testing host: ', browser.launch_url);
        var cookieValue = "grumman:" + browser.launch_url.substring(browser.launch_url.indexOf("http://")+7,browser.launch_url.indexOf("herokuapp.com")+13);
        browser
            .setCookie({
                name:'canary',
                value:cookieValue
            })
			.url(browser.launch_url)
			.waitForElementPresent("html.js.js-success", 30000)
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
