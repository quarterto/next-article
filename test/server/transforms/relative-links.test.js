/*global describe, it*/
"use strict";
var cheerio = require('cheerio');
var expect = require('chai').expect;
var relativeLinksTransform = require('../../../server/transforms/relative-links');

describe('Relative Links', function () {

	it('should understand that topic pages are stream pages', function() {
		var $ = cheerio.load('<a href="http://www.ft.com/topics/themes/Greece_Debt_Crisis" title="Greece debt crisis in depth - FT.com">Greece&#x2019;s <strong>debt</strong></a>');
		$ = relativeLinksTransform($);
		expect($.html()).to.equal('<a href="/stream/themes/Greece Debt Crisis" title="Greece debt crisis in depth - FT.com">Greece&#x2019;s <strong>debt</strong></a>');
	});

	it('should understand that places are now regions', function() {
		var $ = cheerio.load('<a href="http://www.ft.com/topics/places/Greece">Greece</a>');
		$ = relativeLinksTransform($);
		expect($.html()).to.equal('<a href="/stream/regions/Greece">Greece</a>');
	});

	it('should understand that article pages are article pages', function() {
		var $ = cheerio.load('<a href="http://www.ft.com/cms/s/0/f3970f88-0475-11df-8603-00144feabdc0.html" title="Cadbury and Kraft agree &#xA3;11.6bn deal - FT.com">Cadbury was bought by <strong>Kraft</strong></a>');
		$ = relativeLinksTransform($);
		expect($.html()).to.equal('<a href="/f3970f88-0475-11df-8603-00144feabdc0" title="Cadbury and Kraft agree &#xA3;11.6bn deal - FT.com">Cadbury was bought by <strong>Kraft</strong></a>');
	});

	it('should support odd types of links', function() {
		var $ = cheerio.load('<a href="http://www.ft.com/cms/6214279a-60eb-11de-aa12-00144feabdc0.html" title="BlackRock in new league with BGI deal - FT.com">bought the Barclays Global Investors</a>');
		$ = relativeLinksTransform($);
		expect($.html()).to.equal('<a href="/6214279a-60eb-11de-aa12-00144feabdc0" title="BlackRock in new league with BGI deal - FT.com">bought the Barclays Global Investors</a>');
	});

	it('shouldn\' strip content after a relative link', function() {
		var $ = cheerio.load('<p>For Israelis and Lebanese, <a href=\"/9ffb1208-a6ef-11e4-8a71-00144feab7de\">Hizbollah&#x2019;s border attack</a> this week brought back uncomfortable memories of the start of their 2006 war, which left hundreds dead and ruined swaths of Lebanon.</p>');
		$ = relativeLinksTransform($);
		expect($.html()).to.equal('<p>For Israelis and Lebanese, <a href=\"/9ffb1208-a6ef-11e4-8a71-00144feab7de\">Hizbollah&#x2019;s border attack</a> this week brought back uncomfortable memories of the start of their 2006 war, which left hundreds dead and ruined swaths of Lebanon.</p>');
	});

});
