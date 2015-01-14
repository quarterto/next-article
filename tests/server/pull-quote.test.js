"use strict";
var cheerio = require('cheerio');
var expect = require('chai').expect;
var pullQuotesTransform = require('../../server/transforms/pull-quotes');

it('should turn capi v2 pull-quotes into o-quotes', function() {
	var $ = cheerio.load('<pull-quote><pull-quote-text>Think left and think right and think low and think high. Oh, the thinks you can think up if only you try!</pull-quote-text><pull-quote-source>Dr. Seuss</pull-quote-source></pull-quote>');
	$('pull-quote').replaceWith(pullQuotesTransform);

	expect($.html()).to.equal('<blockquote class="o-quote o-quote--standard"><p>Think left and think right and think low and think high. Oh, the thinks you can think up if only you try!</p><cite class="o-quote__cite">Dr. Seuss</cite></blockquote>');
});
