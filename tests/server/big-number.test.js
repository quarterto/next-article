/*global it*/
"use strict";
var cheerio = require('cheerio');
var expect = require('chai').expect;
var bigNumberTransform = require('../../server/transforms/big-number');

it('should understand that topic pages are stream pages', function() {
	var $ = cheerio.load('<big-number><big-number-headline>33m</big-number-headline><big-number-intro>These are powerful but fragile emissaries of a culture that not even their descendants remember</big-number-intro></big-number>');
	$('big-number').replaceWith(bigNumberTransform);
	expect($.html()).to.equal('<span class="g-pull-out g-inline-element o-big-number o-big-number--standard"><span class="o-big-number__title">33m</span><span class="o-big-number__content">These are powerful but fragile emissaries of a culture that not even their descendants remember</span></span>');
});
