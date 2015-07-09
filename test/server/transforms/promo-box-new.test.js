/*global describe, it*/
'use strict';

var cheerio = require('cheerio');
require('chai').should();
var promoBoxTransform = require('../../../server/transforms/promo-box-new');

describe('Promo Box New', function () {

	it('should transform to promo box HTML - short version', function () {
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
			'<aside data-trackable=\"promobox\" role="complementary" class="promo-box ng-pull-out ng-inline-element">' +
				'<div class="promo-box__title__wrapper"><h3 class="promo-box__title">Tatomer Riesling 2012</h3></div>' +
				'<h4 class="promo-box__headline">Greece debt crisis</h4>' +
				'<ft-content data-embedded="true" type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/9ccaf9da-cde2-11e4-0f22-978e959e1c97"></ft-content>' +
				'<div class="promo-box__content">' +
				'<div class="promo-box__content__initial"><p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (&#xA3;26.95, Roberson)</p></div></div>' +
			'</aside>'
		);
	});

	it('should transform to promo box HTML - long version', function () {
		var $ = cheerio.load(
			'<promo-box>' +
				'<promo-title><p>Tatomer Riesling 2012</p></promo-title>' +
				'<promo-headline><p>Greece debt crisis</p></promo-headline>' +
				'<promo-image><ft-content data-embedded="true" type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/9ccaf9da-cde2-11e4-0f22-978e959e1c97"></ft-content></promo-image>' +
				'<promo-intro><p><strong>Breakthrough:</strong> “Closing our first seed round in 10 days three times oversubscribed gave us momentum [to carry through] to the execution of our strategy and into the IPO.”</p>' +
				'<p><strong>Best mentor:</strong> “Chris Baohm, my boss at Gresham Partners in Australia . . . made me understand the importance of breaking down complex situations into the core commercial objectives.”</p>' +
				'<p><strong>Biggest mistake:</strong> “It became very clear that we needed a strong team with us who we could trust to navigate the huge due diligence tasks we had in several countries, in a different language.”</p>' +
				'<p><strong>Networking:</strong> “Wherever possible, and especially in Latin America, meet in person. Regardless of how good tech is, a face-to-face meeting is irreplaceable.”</p></promo-intro>' +
			'</promo-box>'
		);

		$ = promoBoxTransform($);
		$.html().should.equal(
			'<aside data-trackable=\"promobox\" role="complementary" class="promo-box ng-pull-out ng-inline-element o-expander promo-box--long" data-o-component="o-expander" data-o-expander-shrink-to="0" data-o-expander-count-selector=".promo-box__content__extension">' +
				'<div class="promo-box__title__wrapper"><h3 class="promo-box__title">Tatomer Riesling 2012</h3></div>' +
				'<h4 class="promo-box__headline">Greece debt crisis</h4>' +
				'<ft-content data-embedded="true" type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/9ccaf9da-cde2-11e4-0f22-978e959e1c97"></ft-content>' +
				'<div class="promo-box__content o-expander__content">' +
				'<div class="promo-box__content__initial"><p><strong>Breakthrough:</strong> &#x201C;Closing our first seed round in 10 days three times oversubscribed gave us momentum [to carry through] to the execution of our strategy and into the IPO.&#x201D;</p>' +
				'<p><strong>Best mentor:</strong> &#x201C;Chris Baohm, my boss at Gresham Partners in Australia&#x2009;.&#x2009;.&#x2009;.&#x2009;made me understand the importance of breaking down complex situations into the core commercial objectives.&#x201D;</p></div>' +
				'<div class="promo-box__content__extension"><p><strong>Biggest mistake:</strong> &#x201C;It became very clear that we needed a strong team with us who we could trust to navigate the huge due diligence tasks we had in several countries, in a different language.&#x201D;</p>' +
				'<p><strong>Networking:</strong> &#x201C;Wherever possible, and especially in Latin America, meet in person. Regardless of how good tech is, a face-to-face meeting is irreplaceable.&#x201D;</p></div></div>' +
				'<button class="o-expander__toggle o--if-js"></button>' +
			'</aside>'
		);
	});

	it('should output default title if no title provided', function () {
		var $ = cheerio.load(
			'<promo-box>' +
				'<promo-headline><p>Greece debt crisis</p></promo-headline>' +
				'<promo-image><ft-content data-embedded="true" type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/9ccaf9da-cde2-11e4-0f22-978e959e1c97"></ft-content></promo-image>' +
				'<promo-intro><p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (£26.95, Roberson)</p></promo-intro>' +
			'</promo-box>'
		);

		$ = promoBoxTransform($);
		$.html().should.equal(
			'<aside data-trackable=\"promobox\" role="complementary" class="promo-box ng-pull-out ng-inline-element">' +
				'<div class="promo-box__title__wrapper"><h3 class="promo-box__title">Related Content</h3></div>' +
				'<h4 class="promo-box__headline">Greece debt crisis</h4>' +
				'<ft-content data-embedded="true" type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/9ccaf9da-cde2-11e4-0f22-978e959e1c97"></ft-content>' +
				'<div class="promo-box__content">' +
				'<div class="promo-box__content__initial"><p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (&#xA3;26.95, Roberson)</p></div></div>' +
			'</aside>'
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
			'<aside data-trackable=\"promobox\" role="complementary" class="promo-box ng-pull-out ng-inline-element">' +
				'<div class="promo-box__title__wrapper"><h3 class="promo-box__title">Tatomer Riesling 2012</h3></div>' +
				'<ft-content data-embedded="true" type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/9ccaf9da-cde2-11e4-0f22-978e959e1c97"></ft-content>' +
				'<div class="promo-box__content">' +
				'<div class="promo-box__content__initial"><p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (&#xA3;26.95, Roberson)</p></div></div>' +
			'</aside>'
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
			'<aside data-trackable=\"promobox\" role="complementary" class="promo-box ng-pull-out ng-inline-element">' +
				'<div class="promo-box__title__wrapper"><h3 class="promo-box__title">Tatomer Riesling 2012</h3></div>' +
				'<h4 class="promo-box__headline">Greece debt crisis</h4>' +
				'<div class="promo-box__content">' +
				'<div class="promo-box__content__initial"><p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (&#xA3;26.95, Roberson)</p></div></div>' +
			'</aside>'
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
			'<aside data-trackable=\"promobox\" role="complementary" class="promo-box ng-pull-out ng-inline-element">' +
				'<div class="promo-box__title__wrapper"><h3 class="promo-box__title">Tatomer Riesling 2012</h3></div>' +
				'<h4 class="promo-box__headline">Greece debt crisis</h4>' +
				'<ft-content data-embedded="true" type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/9ccaf9da-cde2-11e4-0f22-978e959e1c97"></ft-content>' +
			'</aside>'
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
			'<aside data-trackable=\"promobox\" role="complementary" class="promo-box ng-pull-out ng-inline-element">' +
				'<div class="promo-box__title__wrapper"><h3 class="promo-box__title"><a href="http://blogs.ft.com/nick-butler/2015/04/08/who-next-the-restructuring-begins-in-the-oil-and-gas-business/">Tatomer Riesling 2012</a></h3></div>' +
			'</aside>'
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
			'<aside data-trackable=\"promobox\" role="complementary" class="promo-box ng-pull-out ng-inline-element">' +
				'<div class="promo-box__title__wrapper"><h3 class="promo-box__title">Related Content</h3></div>' +
				'<h4 class="promo-box__headline"><a href="http://www.ft.com/indepth/greece-debt-crisis" title="Greece debt crisis in depth - FT.com">Greece debt crisis</a></h4>' +
			'</aside>'
		);
	});

});
