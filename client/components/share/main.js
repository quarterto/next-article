'use strict';

var oShare = require('o-share');

exports.init = function() {
	var shareContainer = document.querySelector('[data-o-component=o-share]');
	if (shareContainer) {
		new oShare(shareContainer);
	}
};
