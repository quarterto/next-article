"use strict";

module.exports = function (el) {
	var left = 0;
	var top = 0;

	var obj = el;
	if (obj.offsetParent) {
		do {
			left += obj.offsetLeft;
			top += obj.offsetTop;

			obj = obj.offsetParent;
		} while (obj);

		return {
			left: left,
			top: top
		};
	} else {
		return {
			top: el.offsetTop,
			left: el.offsetLeft
		};
	}
};
