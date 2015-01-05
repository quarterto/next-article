"use strict";
module.exports = function(index, options) {
	var adsFlag = options.data.root.flags.ads;
	if(!adsFlag || adsFlag.isSwitchedOff){
		return;
	}

	var input = parseInt(index, 10);
	if (input === 2 || input % 5 === 2) {
		return options.fn(this);
	}
};
