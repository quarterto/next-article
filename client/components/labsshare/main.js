const oOverlay = require('o-overlay');
const labsShare = require('labs-o-share');

let shares;

exports.init = function() {

	oOverlay.init();
	labsShare.addShareCodeToUrl();

	document.body.addEventListener("oOverlay.destroy", function() {
		shares.forEach(function(share) {
			share.destroy();
		});
	});

	document.body.addEventListener("oOverlay.ready", function() {
		shares = labsShare.init();
	});

};
