/*global describe, it*/
"use strict";
var cheerio = require('cheerio');
var expect = require('chai').expect;
var externalImgTransform = require('../../../server/transforms/external-img');

describe('External Img', function () {

	it('should push external images through the image service', function() {
		var $ = cheerio.load('<p>test test test</p><p><img src="http://my-image/image.jpg"></img>Mr Dougan has been blamed by some leading shareholders for failing to grasp the extent of the change in the aftermath of the financial crisis.</p>');
		$('img').replaceWith(externalImgTransform({ fullWidthMainImages: true }));
		expect($.html()).to.equal('<p>test test test</p><p><figure class="article__image-wrapper ng-figure-reset article__inline-image ng-inline-element ng-pull-out"><img src="https://next-geebee.ft.com/image/v1/images/raw/http%3A%2F%2Fmy-image%2Fimage.jpg?source=next&amp;fit=scale-down&amp;width=710\" class="article__image"></figure>Mr Dougan has been blamed by some leading shareholders for failing to grasp the extent of the change in the aftermath of the financial crisis.</p>');
	});

	it('should make images at the beginning of the body full width', function() {
		var $ = cheerio.load('<body><a><img src="http://my-image/image.jpg"></img></a><p>Mr Dougan has been blamed by some leading shareholders for failing to grasp the extent of the change in the aftermath of the financial crisis.</p></body>');
		$('img').replaceWith(externalImgTransform({ fullWidthMainImages: true }));
		expect($.html()).to.equal('<body><a><figure class="article__image-wrapper ng-figure-reset article__main-image"><img src="https://next-geebee.ft.com/image/v1/images/raw/http%3A%2F%2Fmy-image%2Fimage.jpg?source=next&amp;fit=scale-down&amp;width=710\" class="article__image"></figure></a><p>Mr Dougan has been blamed by some leading shareholders for failing to grasp the extent of the change in the aftermath of the financial crisis.</p></body>');
	});

});
