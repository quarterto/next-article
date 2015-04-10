"use strict";

/**
 * Converts a plain HTML string into a DOM object.
 * @param  {String} htmlString Plain HTML in a string format.
 * @return {DOM object}
 */
exports.toDOM = function (htmlString) {
	var d = document,
		i,
		a = d.createElement("div"),
		b = d.createDocumentFragment();

	a.innerHTML = htmlString;

	while (a.firstChild) {
		i = a.firstChild;
		b.appendChild(i);
	}

	return b;
};

/**
 * getComputedStyle polyfill for IE. If native function is available, that one is used.
 * @param  {DOMObject} el     DOM element of which style will be computed.
 * @return {Object}            Object that has a getPropertyValue function which gets a property name as parameter.
 */
exports.getComputedStyle = function (el, pseudoElement) {
	if (!window.getComputedStyle) {
		return {
			getPropertyValue: function (prop) {
				var re = /(\-([a-zA-Z]){1})/g;
				if (prop === 'float') {
					prop = 'styleFloat';
				}

				if (re.test(prop)) {
					prop = prop.replace(re, function () {
						return arguments[2].toUpperCase();
					});
				}
				return el.currentStyle[prop] ? el.currentStyle[prop] : null;
			}
		};
	} else {
		pseudoElement = (typeof pseudoElement === 'boolean' ? pseudoElement : false);
		return window.getComputedStyle(el, pseudoElement);
	}
};

/**
 * Computes the window's size.
 * @return {Object} {width: XX, height: YY}
 */
exports.windowSize = function () {
	var w = window,
		d = document,
		e = d.documentElement,
		g = d.getElementsByTagName('body')[0],
		x = w.innerWidth || g.clientWidth || e.clientWidth,
		y = w.innerHeight || g.clientHeight || e.clientHeight;

	return {
		width: x,
		height: y
	};
};
