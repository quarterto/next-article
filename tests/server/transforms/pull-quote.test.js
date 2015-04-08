/*global describe, it*/
"use strict";
var cheerio = require('cheerio');
var expect = require('chai').expect;
var pullQuotesTransform = require('../../../server/transforms/pull-quotes');

describe('Pull Quote', function () {

	it('should turn capi v2 pull-quotes into o-quotes', function() {
		var $ = cheerio.load('<pull-quote><pull-quote-text>Think left and think right and think low and think high. Oh, the thinks you can think up if only you try!</pull-quote-text><pull-quote-source>Dr. Seuss</pull-quote-source></pull-quote>');
		$('pull-quote').replaceWith(pullQuotesTransform);

		expect($.html()).to.equal('<blockquote class="article__pull-quote ng-pull-out o-quote o-quote--standard"><p>Think left and think right and think low and think high. Oh, the thinks you can think up if only you try!</p><cite class="o-quote__cite">Dr. Seuss</cite></blockquote>');
	});

	it('should not include citation if non available', function() {
		var $ = cheerio.load('<pull-quote><pull-quote-text>Think left and think right and think low and think high. Oh, the thinks you can think up if only you try!</pull-quote-text><pull-quote-source></pull-quote-source></pull-quote>');
		$('pull-quote').replaceWith(pullQuotesTransform);

		expect($.html()).to.equal('<blockquote class="article__pull-quote ng-pull-out o-quote o-quote--standard"><p>Think left and think right and think low and think high. Oh, the thinks you can think up if only you try!</p></blockquote>');
	});

});
