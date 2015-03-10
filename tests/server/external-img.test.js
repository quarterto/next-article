/*global it*/
"use strict";
var cheerio = require('cheerio');
var expect = require('chai').expect;
var externalImgTransform = require('../../server/transforms/external-img');

it('should understand that topic pages are stream pages', function() {
	var $ = cheerio.load('<p><img src="http://my-image/image.jpg"></img>Mr Dougan has been blamed by some leading shareholders for failing to grasp the extent of the change in the aftermath of the financial crisis.</p>');
	$('img').replaceWith(externalImgTransform);
	expect($.html()).to.equal('<p><img src="http://my-image/image.jpg" class="article__inline-image">Mr Dougan has been blamed by some leading shareholders for failing to grasp the extent of the change in the aftermath of the financial crisis.</p>');
});
