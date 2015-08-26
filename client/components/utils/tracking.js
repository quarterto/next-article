'use strict';

var sendTrackingEvent = function(data) {
	fetch('https://spoor-api.ft.com/ingest', {
		method: 'post',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'Content-Length': new Buffer(JSON.stringify(data)).length
		},
		body: JSON.stringify(data)
	});
};

module.exports = sendTrackingEvent;
