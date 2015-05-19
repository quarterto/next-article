/*global describe, it*/
"use strict";
var cheerio = require('cheerio');
var expect = require('chai').expect;
var externalImgTransform = require('../../../server/transforms/external-img');

describe('External Img', function () {

	it('should understand that topic pages are stream pages', function() {
		var $ = cheerio.load('<p><img src="http://my-image/image.jpg"></img>Mr Dougan has been blamed by some leading shareholders for failing to grasp the extent of the change in the aftermath of the financial crisis.</p>');
		$('img').replaceWith(externalImgTransform);
		expect($.html()).to.equal('<p><figure class="article__image-wrapper article__inline-image ng-inline-element ng-pull-out"><img src="https://image.webservices.ft.com/v1/images/raw/http%3A%2F%2Fmy-image%2Fimage.jpg?source=next&amp;fit=scale-down\" class="article__image"></figure>Mr Dougan has been blamed by some leading shareholders for failing to grasp the extent of the change in the aftermath of the financial crisis.</p>');
	});

});
