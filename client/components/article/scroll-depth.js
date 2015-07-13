'use strict';

var beacon = require('next-beacon-component');
var throttle = require('../../libs/throttle');

var mockedWindowHeight;
// these are what scroll depth are bucketed into
var percentageBuckets = [25, 50, 75, 100];
var article = document.querySelector('.article__body');

function getPercentageViewable() {
	var windowHeight = mockedWindowHeight || window.innerHeight;
	return (100 / article.getBoundingClientRect().height) * (windowHeight - article.getBoundingClientRect().top);
}
function fireBeacon(percentage) {
	// need to also send all 'smaller' percentages
	var currentBuckets = percentageBuckets.filter(function (bucket) {
		return bucket <= percentage;
	});
	currentBuckets.forEach(function (currentBucket) {
		if (scrollDepth.percentagesViewed.indexOf(currentBucket) === -1) {
			beacon.fire('scrolldepth', { percentageViewed: currentBucket });
			scrollDepth.percentagesViewed.push(currentBucket);
		}
	});
}

var scrollDepth = {
	// keep a log so we don't send the same percentage multiple times
	percentagesViewed: [],

	init: function (flags, opts) {
		opts = opts || {};
		// allow mocking of window height
		mockedWindowHeight = opts.windowHeight;
		if (flags.get('articleScrollDepthTracking') && article) {
			// how much of the article can we initially see
			fireBeacon(getPercentageViewable());
			// throttle scrolling
			window.addEventListener('scroll', throttle(function () {
				fireBeacon(getPercentageViewable());
			}, opts.delay !== undefined ? opts.delay : 250));
		}
	}
};

module.exports = scrollDepth;
