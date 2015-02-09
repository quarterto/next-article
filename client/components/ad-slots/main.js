'use strict';

var getCurrentBreakpoint = require('o-grid/src/js/getCurrentLayout');

var dummyAd = document.createElement('img');
	dummyAd.src = '/grumman/assets/img/mpu.jpeg';

var mpuSlotL = document.querySelector('[data-ad-mpu="l"]');
var mpuSlotXs = document.querySelector('[data-ad-mpu="xs"]');

function placeMpu () {
	console.log('placeMpu called');
	var breakpoint = getCurrentBreakpoint().toLowerCase();
	if (breakpoint === 'l' || breakpoint === 'xl') {
		mpuSlotL.appendChild(dummyAd);
		mpuSlotXs.innerHTML('');
	} else {
		mpuSlotXs.appendChild(dummyAd);
		mpuSlotL.innerHTML('');
	}
}

module.exports = {
	placeMpu: placeMpu
};