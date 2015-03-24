/*global describe, it*/
'use strict';

var cheerio = require('cheerio');
require('chai').should();
var promoBoxTransform = require('../../server/transforms/promo-box');

describe('Promo Box', function () {

	it('should transform to promo box HTML', function () {
		var $ = cheerio.load(
			'<promo-box>' +
				'<promo-title><p>Tatomer Riesling 2012</p></promo-title>' +
				'<promo-headline><p><a href="http://www.ft.com/indepth/greece-debt-crisis" title="Greece debt crisis in depth - FT.com">Greece debt crisis</a></p></promo-headline>' +
				'<promo-image><ft-content data-embedded="true" type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/9ccaf9da-cde2-11e4-0f22-978e959e1c97"></ft-content></promo-image>' +
				'<promo-intro><p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (£26.95, Roberson)</p></promo-intro>' +
			'</promo-box>'
		);

		$('promo-box').replaceWith(promoBoxTransform);
		$.html().should.equal(
			'<div class="article__promo-box ng-pull-out ng-inline-element">' +
				'<h3 class="article__promo-box__title">Tatomer Riesling 2012</h3>' +
				'<h4 class="article__promo-box__headline"><a href="http://www.ft.com/indepth/greece-debt-crisis" title="Greece debt crisis in depth - FT.com">Greece debt crisis</a></h4>' +
				'<ft-content data-embedded="true" type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/9ccaf9da-cde2-11e4-0f22-978e959e1c97"></ft-content>' +
				'<div class="article__promo-box__content"><p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (&#xA3;26.95, Roberson)</p></div>' +
			'</div>'
		);
	});

	it('should handle no promo-box headling', function () {
		var $ = cheerio.load(
			'<promo-box>' +
				'<promo-title><p>Tatomer Riesling 2012</p></promo-title>' +
				'<promo-image><ft-content data-embedded="true" type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/9ccaf9da-cde2-11e4-0f22-978e959e1c97"></ft-content></promo-image>' +
				'<promo-intro><p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (£26.95, Roberson)</p></promo-intro>' +
			'</promo-box>'
		);

		$('promo-box').replaceWith(promoBoxTransform);
		$.html().should.equal(
			'<div class="article__promo-box ng-pull-out ng-inline-element">' +
				'<h3 class="article__promo-box__title">Tatomer Riesling 2012</h3>' +
				'<ft-content data-embedded="true" type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/9ccaf9da-cde2-11e4-0f22-978e959e1c97"></ft-content>' +
				'<div class="article__promo-box__content"><p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (&#xA3;26.95, Roberson)</p></div>' +
			'</div>'
		);
	});

});
