"use strict";

function ScrollMonitor (el, callback) {
	var elToListen = el;
	var elToReadPosition = el;
	if (el === document.body || el === document.getElementsByTagName('html')[0] || el === window) {
		elToReadPosition = [document.body, document.getElementsByTagName('html')[0]];
		elToListen = window;
	}

	var started = false;


	var lastTime = 0;
	var throttle = 200;
	var scrollPosition;
	var lastScrollPosition;
	var lastScrollPositionCheck;
	var i;

	function onValidScroll (force) {
		if (elToReadPosition instanceof Array) {
			scrollPosition = 0;
			for (i = 0; i < elToReadPosition.length; i++) {
				if (elToReadPosition[i].scrollTop > 0) {
					scrollPosition = elToReadPosition[i].scrollTop;
				}
			}
		} else {
			scrollPosition = elToReadPosition.scrollTop;
		}

		if (force || lastScrollPosition !== scrollPosition) {
			callback(scrollPosition);
		}
		lastScrollPosition = scrollPosition;
	}


	function onScroll () {
		clearTimeout(lastScrollPositionCheck);
		lastScrollPositionCheck = setTimeout(function () {
			onValidScroll();
		}, throttle);

		if (new Date().getTime() - lastTime > throttle) {
			lastTime = new Date().getTime();

			onValidScroll(true);
		}
	}

	this.start = function () {
		if (!started) {
			started = true;

			elToListen.addEventListener('scroll', onScroll);
		}
	};

	this.stop = function () {
		if (started) {
			started = false;

			elToListen.removeEventListener('scroll', onScroll);
		}
	};

	this.destroy = function () {
		this.stop();

		elToListen = null;
		elToReadPosition = null;

		started = null;
		lastTime = null;
		throttle = null;
		scrollPosition = null;
		lastScrollPosition = null;
		lastScrollPositionCheck = null;
		i = null;
	};

	this.start.call(this);
}
module.exports = ScrollMonitor;
