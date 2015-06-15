'use strict';

module.exports = function (fn, delay) {
	delay = delay || 250;
	var timer = null;

	return function () {
		var context = this;
		var args = arguments;
		clearTimeout(timer);
		timer = setTimeout(function () {
  			fn.apply(context, args);
		}, delay);
	};
};
