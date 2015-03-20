/*global it*/
"use strict";
var cheerio = require('cheerio');
var expect = require('chai').expect;
var bigNumberTransform = require('../../server/transforms/big-number');

it('should transform html to o-big-number format', function() {
	var $ = cheerio.load('<big-number><big-number-headline>33m</big-number-headline><big-number-intro>These are powerful but fragile emissaries of a culture that not even their descendants remember</big-number-intro></big-number>');
	$('big-number').replaceWith(bigNumberTransform);
	expect($.html()).to.equal('<span class="article__big-number ng-pull-out ng-inline-element o-big-number o-big-number--standard"><span class="o-big-number__title">33m</span><span class="o-big-number__content">These are powerful but fragile emissaries of a culture that not even their descendants remember</span></span>');
});

it('should maintain html', function() {
	var $ = cheerio.load('<big-number><big-number-headline><a href="http://next.ft.com/1b852d96-ced7-11e4-893d-00144feab7de">33m</a></big-number-headline><big-number-intro>These are <a href="http://next.ft.com/712943a2-cda3-11e4-8760-00144feab7de">powerful but fragile</a> emissaries of a culture that not even their descendants remember</big-number-intro></big-number>');
	$('big-number').replaceWith(bigNumberTransform);
	expect($.html()).to.equal('<span class="article__big-number ng-pull-out ng-inline-element o-big-number o-big-number--standard"><span class="o-big-number__title"><a href="http://next.ft.com/1b852d96-ced7-11e4-893d-00144feab7de">33m</a></span><span class="o-big-number__content">These are <a href="http://next.ft.com/712943a2-cda3-11e4-8760-00144feab7de">powerful but fragile</a> emissaries of a culture that not even their descendants remember</span></span>');
});
