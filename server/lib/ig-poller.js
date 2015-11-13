'use strict';

var pollerData = [];
var Poller = require('ft-poller');
var poller = new Poller({
	url: 'https://bertha.ig.ft.com/view/publish/gss/1Rlx_BfkwCpE8KBJZVK_p5gO61HZF7fRckQige6Hwbl8/mappings',
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
