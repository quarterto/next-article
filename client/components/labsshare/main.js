const oOverlay = require('o-overlay');
const labsShare = require('labs-o-share');

let shares;

exports.init = function() {

	const triggers = Array.prototype.slice.call(document.querySelectorAll('.o-overlay-trigger'));

	triggers.forEach((overlay, index) => overlay.dataset.oOverlayId = index);

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
