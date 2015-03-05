'use strict';

module.exports.init = function (flags) {
	if (flags.get('articleTOC').isSwitchedOff) {
		return false;
	}

	var duration = 1000,
		// https://gist.github.com/gre/1650294
		easeFunction = function (t) { return 1-(--t)*t*t*t };

	document.querySelector('.article__toc__items').addEventListener('change', function (event) {

		var scrollFrom = document.body.scrollTop,
			scrollDist = document.querySelector('#' + event.target.value).getBoundingClientRect().top,
			startTime  = new Date(),
			interval   = window.setInterval(function () {
				var elapsed = new Date() - startTime;

				document.body.scrollTop = scrollFrom + (easeFunction(elapsed / duration) * scrollDist);
			}, 15);

		window.setTimeout(function () {
			window.clearInterval(interval);
			document.body.scrollTop = scrollTo;
		}, duration);
	});
};
