/*global describe, it*/
"use strict";
var cheerio = require('cheerio');
var expect = require('chai').expect;
var slideshowTransform = require('../../../server/transforms/slideshow');

describe('Slideshow', function () {

	it('should understand slideshows', function() {
		var $ = cheerio.load('<a href="http://www.ft.com/cms/s/0/f3970f88-0475-11df-8603-00144feabdc0.html#slide0"></a>');
		$('a[href$="#slide0"]').replaceWith(slideshowTransform);
		expect($.html()).to.equal('<ft-slideshow data-uuid="f3970f88-0475-11df-8603-00144feabdc0"></ft-slideshow>');
	});

	it('should move the slideshow before the parent `p`', function () {
		var $ = cheerio.load('<p><a href="http://www.ft.com/cms/s/0/f3970f88-0475-11df-8603-00144feabdc0.html#slide0"></a>A gallery</p>');
		$('a[href$="#slide0"]').replaceWith(slideshowTransform);
		expect($.html()).to.equal('<ft-slideshow data-uuid="f3970f88-0475-11df-8603-00144feabdc0"></ft-slideshow><p>A gallery</p>');
	});

});
