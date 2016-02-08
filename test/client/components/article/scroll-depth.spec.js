/* global describe, it, before, after */
'use strict';

var scrollDepth = require('../../../../client/components/article/scroll-depth.js');

describe('Scroll Depth', function () {

	var bigPageEl;
	var articleEl;

	before(function () {
		bigPageEl = document.createElement('div');
		bigPageEl.style.height = '2000px';
		document.body.appendChild(bigPageEl);
		articleEl = document.createElement('div');
		articleEl.className = 'n-content-body';
		articleEl.style.height = '1000px';
		articleEl.style.position = 'absolute';
		articleEl.style.top = '500px';
		document.body.appendChild(articleEl);
	});

	after(function () {
		document.body.removeChild(bigPageEl);
		document.body.removeChild(articleEl);
	});

	it('should exist', function () {
		scrollDepth.should.exist;
	});

	it('should fire initial scroll', function () {
		scrollDepth.init({
			get: function () { return true; }
		},
		{
			windowHeight: 1000
		});
		scrollDepth.percentagesViewed.should.eql([25, 50]);
	});

	it('should fire on scroll', function () {
		scrollDepth.init({
			get: function () { return true; }
		},
		{
			windowHeight: 1000,
			delay: 0
		});
		scrollDepth.percentagesViewed.should.eql([25, 50]);
		window.scrollTo(0, 500);
		var scrollEvent = new CustomEvent('scroll');
		window.dispatchEvent(scrollEvent);
		scrollDepth.percentagesViewed.should.eql([25, 50, 75, 100]);
	});

	it('should fire all if small article', function () {
		scrollDepth.init({
			get: function () { return true; }
		},
		{
			windowHeight: 1500
		});
		scrollDepth.percentagesViewed.should.eql([25, 50, 75, 100]);
	});

});
