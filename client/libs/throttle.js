'use strict';

// cribbed from https://remysharp.com/2010/07/21/throttling-function-calls
module.exports = function (fn, threshhold, scope) {
	threshhold = threshhold || 250;
	var last;
	var deferTimer;
	return function () {
		var context = scope || this;
		var now = +new Date();
		var args = arguments;

		if (last && now < last + threshhold) {
			// hold on to it
			clearTimeout(deferTimer);
			deferTimer = setTimeout(function () {
				last = now;
				fn.apply(context, args);
			}, threshhold);
		} else {
			last = now;
			fn.apply(context, args);
		}
	};
};
