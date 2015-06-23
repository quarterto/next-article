/*global describe, it*/
'use strict';

var cheerio = require('cheerio');
require('chai').should();
var promoBoxTransform = require('../../../server/transforms/promo-box');

describe('Promo Box', function () {

	it('should transform to promo box HTML', function () {
		var $ = cheerio.load(
			'<promo-box>' +
				'<promo-title><p>Tatomer Riesling 2012</p></promo-title>' +
				'<promo-headline><p>Greece debt crisis</p></promo-headline>' +
				'<promo-image><ft-content data-embedded="true" type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/9ccaf9da-cde2-11e4-0f22-978e959e1c97"></ft-content></promo-image>' +
				'<promo-intro><p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (£26.95, Roberson)</p></promo-intro>' +
			'</promo-box>'
		);

		$ = promoBoxTransform($);
		$.html().should.equal(
			'<div data-trackable=\"promobox\" class="article__promo-box ng-pull-out ng-inline-element">' +
				'<h3 class="article__promo-box__title">Tatomer Riesling 2012</h3>' +
				'<h4 class="article__promo-box__headline">Greece debt crisis</h4>' +
				'<ft-content data-embedded="true" type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/9ccaf9da-cde2-11e4-0f22-978e959e1c97"></ft-content>' +
				'<div class="article__promo-box__content"><p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (&#xA3;26.95, Roberson)</p></div>' +
			'</div>'
		);
	});

	it('should handle no promo-box title', function () {
		var $ = cheerio.load(
			'<promo-box>' +
				'<promo-headline><p>Greece debt crisis</p></promo-headline>' +
				'<promo-image><ft-content data-embedded="true" type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/9ccaf9da-cde2-11e4-0f22-978e959e1c97"></ft-content></promo-image>' +
				'<promo-intro><p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (£26.95, Roberson)</p></promo-intro>' +
			'</promo-box>'
		);

		$ = promoBoxTransform($);
		$.html().should.equal(
			'<div data-trackable=\"promobox\" class="article__promo-box ng-pull-out ng-inline-element">' +
				'<h4 class="article__promo-box__headline">Greece debt crisis</h4>' +
				'<ft-content data-embedded="true" type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/9ccaf9da-cde2-11e4-0f22-978e959e1c97"></ft-content>' +
				'<div class="article__promo-box__content"><p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (&#xA3;26.95, Roberson)</p></div>' +
			'</div>'
		);
	});

	it('should handle no promo-box headline', function () {
		var $ = cheerio.load(
			'<promo-box>' +
				'<promo-title><p>Tatomer Riesling 2012</p></promo-title>' +
				'<promo-image><ft-content data-embedded="true" type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/9ccaf9da-cde2-11e4-0f22-978e959e1c97"></ft-content></promo-image>' +
				'<promo-intro><p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (£26.95, Roberson)</p></promo-intro>' +
			'</promo-box>'
		);

		$ = promoBoxTransform($);
		$.html().should.equal(
			'<div data-trackable=\"promobox\" class="article__promo-box ng-pull-out ng-inline-element">' +
				'<h3 class="article__promo-box__title">Tatomer Riesling 2012</h3>' +
				'<ft-content data-embedded="true" type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/9ccaf9da-cde2-11e4-0f22-978e959e1c97"></ft-content>' +
				'<div class="article__promo-box__content"><p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (&#xA3;26.95, Roberson)</p></div>' +
			'</div>'
		);
	});

	it('should handle no promo-box image', function () {
		var $ = cheerio.load(
			'<promo-box>' +
				'<promo-title><p>Tatomer Riesling 2012</p></promo-title>' +
				'<promo-headline><p>Greece debt crisis</p></promo-headline>' +
				'<promo-intro><p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (£26.95, Roberson)</p></promo-intro>' +
			'</promo-box>'
		);

		$ = promoBoxTransform($);
		$.html().should.equal(
			'<div data-trackable=\"promobox\" class="article__promo-box ng-pull-out ng-inline-element">' +
				'<h3 class="article__promo-box__title">Tatomer Riesling 2012</h3>' +
				'<h4 class="article__promo-box__headline">Greece debt crisis</h4>' +
				'<div class="article__promo-box__content"><p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (&#xA3;26.95, Roberson)</p></div>' +
			'</div>'
		);
	});

	it('should handle no promo-box intro', function () {
		var $ = cheerio.load(
			'<promo-box>' +
				'<promo-title><p>Tatomer Riesling 2012</p></promo-title>' +
				'<promo-headline><p>Greece debt crisis</p></promo-headline>' +
				'<promo-image><ft-content data-embedded="true" type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/9ccaf9da-cde2-11e4-0f22-978e959e1c97"></ft-content></promo-image>' +
			'</promo-box>'
		);

		$ = promoBoxTransform($);
		$.html().should.equal(
			'<div data-trackable=\"promobox\" class="article__promo-box ng-pull-out ng-inline-element">' +
				'<h3 class="article__promo-box__title">Tatomer Riesling 2012</h3>' +
				'<h4 class="article__promo-box__headline">Greece debt crisis</h4>' +
				'<ft-content data-embedded="true" type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/9ccaf9da-cde2-11e4-0f22-978e959e1c97"></ft-content>' +
			'</div>'
		);
	});

	it('should leave in any HTML in title (except wrapped p tag)', function () {
		var $ = cheerio.load(
			'<promo-box>' +
				'<promo-title><p><a href="http://blogs.ft.com/nick-butler/2015/04/08/who-next-the-restructuring-begins-in-the-oil-and-gas-business/">Tatomer Riesling 2012</a></p></promo-title>' +
			'</promo-box>'
		);

		$ = promoBoxTransform($);
		$.html().should.equal(
			'<div data-trackable=\"promobox\" class="article__promo-box ng-pull-out ng-inline-element">' +
				'<h3 class="article__promo-box__title"><a href="http://blogs.ft.com/nick-butler/2015/04/08/who-next-the-restructuring-begins-in-the-oil-and-gas-business/">Tatomer Riesling 2012</a></h3>' +
			'</div>'
		);
	});

	it('should leave in any HTML in headline (except wrapped p tag)', function () {
		var $ = cheerio.load(
			'<promo-box>' +
				'<promo-headline><p><a href="http://www.ft.com/indepth/greece-debt-crisis" title="Greece debt crisis in depth - FT.com">Greece debt crisis</a></p></promo-headline>' +
			'</promo-box>'
		);

		$ = promoBoxTransform($);
		$.html().should.equal(
			'<div data-trackable=\"promobox\" class="article__promo-box ng-pull-out ng-inline-element">' +
				'<h4 class="article__promo-box__headline"><a href="http://www.ft.com/indepth/greece-debt-crisis" title="Greece debt crisis in depth - FT.com">Greece debt crisis</a></h4>' +
			'</div>'
		);
	});

});
