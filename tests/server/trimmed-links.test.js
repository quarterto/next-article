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

it('should not link a trailing full stop', function() {
	var $ = cheerio.load('<p>The barristers opinion, commissioned by Jesse Norman, a prominent Conservative backbencher and member of the Treasury select committee, calls into question whether <a href="/d6fff9f4-bddc-11e4-9d09-00144feab7de">the Banks newly revamped governance structure is robust enough to hold its officials and employees to account. \n</a></p>');
	$('a').replaceWith(trimmedLinksTransform);
	expect($.html()).to.equal('<p>The barristers opinion, commissioned by Jesse Norman, a prominent Conservative backbencher and member of the Treasury select committee, calls into question whether <a href="/d6fff9f4-bddc-11e4-9d09-00144feab7de">the Banks newly revamped governance structure is robust enough to hold its officials and employees to account</a>.  </p>');
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

it('should only link within quotes', function() {
	var $ = cheerio.load('he was <a href="http://www.ft.com/intl/cms/s/2/3d2ba75c-1fdf-11e3-8861-00144feab7de.html#axzz3QvWy0Wvl" title="China’s ‘sent-down’ youth - FT.com">“sent down”</a> to the countryside');
	$('a').replaceWith(trimmedLinksTransform);
	expect($.html()).to.equal('he was &#x201C;<a href=\"http://www.ft.com/intl/cms/s/2/3d2ba75c-1fdf-11e3-8861-00144feab7de.html#axzz3QvWy0Wvl\" title=\"China&#x2019;s &#x2018;sent-down&#x2019; youth - FT.com\">sent down</a>&#x201D; to the countryside');
});

it('should only not include the quote if the string starts and finishes with a quote', function() {
	var $ = cheerio.load('<a href="http://www.ft.com/intl/cms/s/2/3d2ba75c-1fdf-11e3-8861-00144feab7de.html#axzz3QvWy0Wvl" title="China’s ‘sent-down’ youth - FT.com">he was “sent down”</a> to the countryside');
	$('a').replaceWith(trimmedLinksTransform);
	expect($.html()).to.equal('<a href=\"http://www.ft.com/intl/cms/s/2/3d2ba75c-1fdf-11e3-8861-00144feab7de.html#axzz3QvWy0Wvl\" title=\"China&#x2019;s &#x2018;sent-down&#x2019; youth - FT.com\">he was &#x201C;sent down&#x201D;</a> to the countryside');
});

it('should fix the spaces even if editorial are blatantly trolling me', function() {
	var $ = cheerio.load("<a>distort the CPIH measure\n</a> , ");
	$('a').replaceWith(trimmedLinksTransform);

	// these additional spaces are tidied up later
	expect($.html()).to.equal('<a>distort the CPIH measure</a>  , ');
});
