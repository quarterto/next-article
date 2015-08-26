'use strict';

var pollerData = { access_metadata: [] };
var Poller = require('ft-poller');
var poller = new Poller({
	url: 'http://blogs.ft.com/__access_metadata',
	parseData: function (data) {
		pollerData = data;
	}
});

module.exports = {
	start: poller.start.bind(poller, { initialRequest: true }),
	getData: function () {
		return pollerData;
	}
};
