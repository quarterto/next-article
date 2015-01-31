/*global it*/
"use strict";
var cheerio = require('cheerio');
var expect = require('chai').expect;
var trimmedLinksTransform = require('../../server/transforms/trimmed-links');

it('should trim the inside of a tags, pad the outside', function() {
	var $ = cheerio.load('The last time<a href="http://www.ft.com/intl/world/asia-pacific/china"> China </a>was the world&#x2019;s largest economy');
	$('a').replaceWith(trimmedLinksTransform);
	expect($.html()).to.equal('The last time <a href="http://www.ft.com/intl/world/asia-pacific/china">China</a> was the world&#x2019;s largest economy');
});

it('should trim the inside of a tags, pad the outside without damaging their internal structure', function() {
	var $ = cheerio.load('The last time<a href="http://www.ft.com/intl/world/asia-pacific/china"> <strong>China</strong> </a>was the world&#x2019;s largest economy');
	$('a').replaceWith(trimmedLinksTransform);
	expect($.html()).to.equal('The last time <a href="http://www.ft.com/intl/world/asia-pacific/china"><strong>China</strong></a> was the world&#x2019;s largest economy');
});

it('should ensure trailing commas go outside of a tags even when padded with an additional space', function() {
	var $ = cheerio.load('<p>including <a href="http://www.ft.com/intl/indepth/living-with-cheaper-oil">oil, </a> and in the stuttering performance</p>');
	$('a').replaceWith(trimmedLinksTransform);
	expect($.html()).to.equal('<p>including <a href="http://www.ft.com/intl/indepth/living-with-cheaper-oil">oil</a>,  and in the stuttering performance</p>');
});

it('should ensure trailing commas go outside of a tags', function() {
	var $ = cheerio.load('<p>including <a href="http://www.ft.com/intl/indepth/living-with-cheaper-oil">oil,</a> and in the stuttering performance</p>');
	$('a').replaceWith(trimmedLinksTransform);
	expect($.html()).to.equal('<p>including <a href="http://www.ft.com/intl/indepth/living-with-cheaper-oil">oil</a>, and in the stuttering performance</p>');
});

it('should fix the spaces even if editorial are blatantly trolling me', function() {
	var $ = cheerio.load("<a>distort the CPIH measure\n</a> , ");
	$('a').replaceWith(trimmedLinksTransform);
	expect($.html()).to.equal('<a>distort the CPIH measure</a> , ');
});
