/* global describe, it */

'use strict';

var transform = require('./transform-helper');
require('chai').should();

describe('Promo-boxes', function() {

	it('should should transform to promo box - short version', function() {
		return transform(
			'<promo-box>' +
				'<promo-title><p>Tatomer Riesling 2012</p></promo-title>' +
				'<promo-headline><p>Greece debt crisis</p></promo-headline>' +
				'<promo-image><img src="http://com.ft.imagepublish.prod.s3.amazonaws.com/1871b094-3b7d-11e5-bbd1-b37bc06f590c" /></promo-image>' +
				'<promo-intro><p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (£26.95, Roberson)</p></promo-intro>' +
			'</promo-box>'
		)
		.then(function (transformedXml) {
			transformedXml.should.equal(
				'<aside class="promo-box ng-inline-element" data-trackable="promobox" role="complementary">' +
					'<div class="promo-box__wrapper">' +
						'<div class="promo-box__title">' +
							'<div class="promo-box__title__name">Tatomer Riesling 2012</div>' +
						'</div>' +
						'<div class="promo-box__headline">Greece debt crisis</div>' +
						'<div class="promo-box__image">' +
							'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http://com.ft.imagepublish.prod.s3.amazonaws.com/1871b094-3b7d-11e5-bbd1-b37bc06f590c?source=next&amp;fit=scale-down&amp;width=300">' +
						'</div>' +
						'<div class="promo-box__content">' +
							'<div class="promo-box__content__initial">' +
								'<p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (£26.95, Roberson)</p>' +
								'</div>' +
							'</div>' +
					'</div>' +
				'</aside>\n'
			);
		});
	});

	it('should transform to promo box - long version - no expander', function () {
		return transform(
			'<promo-box>' +
				'<promo-title><p>Tatomer Riesling 2012</p></promo-title>' +
				'<promo-headline><p>Greece debt crisis</p></promo-headline>' +
				'<promo-image><img src="http://com.ft.imagepublish.prod.s3.amazonaws.com/1871b094-3b7d-11e5-bbd1-b37bc06f590c" width="800" height="400" /></promo-image>' +
				'<promo-intro><p><strong>Breakthrough:</strong> “Closing our first seed round in 10 days three times oversubscribed gave us momentum [to carry through] to the execution of our strategy and into the IPO.”</p>' +
				'<p><strong>Best mentor:</strong> “Chris Baohm, my boss at Gresham Partners in Australia . . . made me understand the importance of breaking down complex situations into the core commercial objectives.”</p></promo-intro>' +
			'</promo-box>'
		)
		.then(function (transformedXml) {
			transformedXml.should.equal(
				'<aside class="promo-box promo-box--long ng-inline-element" data-trackable="promobox" role="complementary">' +
					'<div class="promo-box__wrapper">' +
						'<div class="promo-box__title">' +
							'<div class="promo-box__title__name">Tatomer Riesling 2012</div>' +
						'</div>' +
						'<div class="promo-box__headline">Greece debt crisis</div>' +
						'<div class="promo-box__image">' +
							'<div class="article-image__placeholder" style="padding-top:50%;">' +
								'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http://com.ft.imagepublish.prod.s3.amazonaws.com/1871b094-3b7d-11e5-bbd1-b37bc06f590c?source=next&amp;fit=scale-down&amp;width=300">' +
							'</div>' +
						'</div>' +
						'<div class="promo-box__content">' +
						'<div class="promo-box__content__initial"><p><strong>Breakthrough:</strong> “Closing our first seed round in 10 days three times oversubscribed gave us momentum [to carry through] to the execution of our strategy and into the IPO.”</p>' +
						'<p><strong>Best mentor:</strong> “Chris Baohm, my boss at Gresham Partners in Australia . . . made me understand the importance of breaking down complex situations into the core commercial objectives.”</p></div></div>' +
					'</div>' +
				'</aside>\n'
			);
		});
	});

	it('should transform to promo box HTML - long version - with expander', function () {
		return transform(
			'<promo-box>' +
				'<promo-title><p>Tatomer Riesling 2012</p></promo-title>' +
				'<promo-headline><p>Greece debt crisis</p></promo-headline>' +
				'<promo-image><img src="http://com.ft.imagepublish.prod.s3.amazonaws.com/1871b094-3b7d-11e5-bbd1-b37bc06f590c" /></promo-image>' +
				'<promo-intro><p><strong>Breakthrough:</strong> “Closing our first seed round in 10 days three times oversubscribed gave us momentum [to carry through] to the execution of our strategy and into the IPO.”</p>' +
				'<p><strong>Best mentor:</strong> “Chris Baohm, my boss at Gresham Partners in Australia . . . made me understand the importance of breaking down complex situations into the core commercial objectives.”</p>' +
				'<p><strong>Biggest mistake:</strong> “It became very clear that we needed a strong team with us who we could trust to navigate the huge due diligence tasks we had in several countries, in a different language.”</p>' +
				'<p><strong>Networking:</strong> “Wherever possible, and especially in Latin America, meet in person. Regardless of how good tech is, a face-to-face meeting is irreplaceable.”</p></promo-intro>' +
			'</promo-box>'
		)
		.then(function (transformedXml) {
			transformedXml.should.equal(
				'<aside class="promo-box promo-box--long ng-inline-element o-expander" data-trackable="promobox" role="complementary" data-o-component="o-expander" data-o-expander-shrink-to="0" data-o-expander-count-selector=".promo-box__content__extension">' +
					'<div class="promo-box__wrapper">' +
						'<div class="promo-box__title">' +
							'<div class="promo-box__title__name">Tatomer Riesling 2012</div>' +
						'</div>' +
						'<div class="promo-box__headline">Greece debt crisis</div>' +
						'<div class="promo-box__image">' +
							'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http://com.ft.imagepublish.prod.s3.amazonaws.com/1871b094-3b7d-11e5-bbd1-b37bc06f590c?source=next&amp;fit=scale-down&amp;width=300">' +
						'</div>' +
						'<div class="promo-box__content o-expander__content">' +
							'<div class="promo-box__content__initial"><p><strong>Breakthrough:</strong> “Closing our first seed round in 10 days three times oversubscribed gave us momentum [to carry through] to the execution of our strategy and into the IPO.”</p>' +
							'<p><strong>Best mentor:</strong> “Chris Baohm, my boss at Gresham Partners in Australia . . . made me understand the importance of breaking down complex situations into the core commercial objectives.”</p></div>' +
							'<div class="promo-box__content__extension"><p><strong>Biggest mistake:</strong> “It became very clear that we needed a strong team with us who we could trust to navigate the huge due diligence tasks we had in several countries, in a different language.”</p>' +
							'<p><strong>Networking:</strong> “Wherever possible, and especially in Latin America, meet in person. Regardless of how good tech is, a face-to-face meeting is irreplaceable.”</p></div></div>' +
						'<button class="o-expander__toggle o--if-js" data-trackable="expander-toggle"></button>' +
					'</div>' +
				'</aside>\n'
			);
		});
	});

	it('should output default title if no title provided', function () {
		return transform(
			'<promo-box>' +
				'<promo-headline><p>Greece debt crisis</p></promo-headline>' +
				'<promo-image><img src="http://com.ft.imagepublish.prod.s3.amazonaws.com/1871b094-3b7d-11e5-bbd1-b37bc06f590c" /></promo-image>' +
				'<promo-intro><p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (£26.95, Roberson)</p></promo-intro>' +
			'</promo-box>'
		)
		.then(function (transformedXml) {
			transformedXml.should.equal(
				'<aside class="promo-box ng-inline-element" data-trackable="promobox" role="complementary">' +
					'<div class="promo-box__wrapper">' +
						'<div class="promo-box__title">' +
							'<div class="promo-box__title__name">Related Content</div>' +
						'</div>' +
						'<div class="promo-box__headline">Greece debt crisis</div>' +
						'<div class="promo-box__image">' +
							'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http://com.ft.imagepublish.prod.s3.amazonaws.com/1871b094-3b7d-11e5-bbd1-b37bc06f590c?source=next&amp;fit=scale-down&amp;width=300">' +
						'</div>' +
						'<div class="promo-box__content">' +
						'<div class="promo-box__content__initial"><p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (£26.95, Roberson)</p></div></div>' +
					'</div>' +
				'</aside>\n'
			);
		});
	});

	it('should leave in any HTML in title (except wrapped p tag)', function () {
		return transform(
			'<promo-box>' +
				'<promo-title><p><a href="/c9175806-3054-11e5-8873-775ba7c2ea3d">Greece crisis tests start-ups’ staying power</a> </p></promo-title>' +
			'</promo-box>'
		)
		.then(function(transformedXml) {
			transformedXml.should.equal(
				'<aside class="promo-box ng-inline-element" data-trackable="promobox" role="complementary">' +
					'<div class="promo-box__wrapper">' +
						'<div class="promo-box__title"><div class="promo-box__title__name"><a href="/c9175806-3054-11e5-8873-775ba7c2ea3d" data-trackable="link">Greece crisis tests start-ups’ staying power</a> </div></div>' +
					'</div>' +
				'</aside>\n'
			);
		});
	});

	it('should leave in any HTML in headline (except wrapped p tag)', function () {
		return transform(
			'<promo-box>' +
				'<promo-headline><p><a href="/c9175806-3054-11e5-8873-775ba7c2ea3d">Greece crisis tests start-ups’ staying power</a></p></promo-headline>' +
			'</promo-box>'
		)
		.then(function(transformedXml) {
			transformedXml.should.equal(
				'<aside class="promo-box ng-inline-element" data-trackable="promobox" role="complementary">' +
					'<div class="promo-box__wrapper">' +
						'<div class="promo-box__title"><div class="promo-box__title__name">Related Content</div></div>' +
						'<div class="promo-box__headline"><a href="/c9175806-3054-11e5-8873-775ba7c2ea3d" data-trackable="link">Greece crisis tests start-ups’ staying power</a></div>' +
					'</div>' +
				'</aside>\n'
			);
		});
	});

	it('should handle two promoboxes with different attributes in the same xml', function() {
		return transform(
			'<promo-box>' +
				'<promo-title><p>Tatomer Riesling 2012</p></promo-title>' +
				'<promo-headline><p>Greece debt crisis</p></promo-headline>' +
				'<promo-image><img src="http://com.ft.imagepublish.prod.s3.amazonaws.com/1871b094-3b7d-11e5-bbd1-b37bc06f590c" /></promo-image>' +
				'<promo-intro><p><strong>Breakthrough:</strong> “Closing our first seed round in 10 days three times oversubscribed gave us momentum [to carry through] to the execution of our strategy and into the IPO.”</p>' +
				'<p><strong>Best mentor:</strong> “Chris Baohm, my boss at Gresham Partners in Australia . . . made me understand the importance of breaking down complex situations into the core commercial objectives.”</p>' +
				'<p><strong>Biggest mistake:</strong> “It became very clear that we needed a strong team with us who we could trust to navigate the huge due diligence tasks we had in several countries, in a different language.”</p>' +
				'<p><strong>Networking:</strong> “Wherever possible, and especially in Latin America, meet in person. Regardless of how good tech is, a face-to-face meeting is irreplaceable.”</p></promo-intro>' +
			'</promo-box>' +
			'<promo-box>' +
				'<promo-title><p>Tatomer Riesling 2012</p></promo-title>' +
				'<promo-headline><p>Greece debt crisis</p></promo-headline>' +
				'<promo-image><img src="http://com.ft.imagepublish.prod.s3.amazonaws.com/1871b094-3b7d-11e5-bbd1-b37bc06f590c" /></promo-image>' +
				'<promo-intro><p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (£26.95, Roberson)</p></promo-intro>' +
			'</promo-box>'
		)
		.then(function(transformedXml) {
			transformedXml.should.equal(
				'<aside class="promo-box promo-box--long ng-inline-element o-expander" data-trackable="promobox" role="complementary" data-o-component="o-expander" data-o-expander-shrink-to="0" data-o-expander-count-selector=".promo-box__content__extension">' +
					'<div class="promo-box__wrapper">' +
						'<div class="promo-box__title"><div class="promo-box__title__name">Tatomer Riesling 2012</div></div>' +
						'<div class="promo-box__headline">Greece debt crisis</div>' +
						'<div class="promo-box__image">' +
							'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http://com.ft.imagepublish.prod.s3.amazonaws.com/1871b094-3b7d-11e5-bbd1-b37bc06f590c?source=next&amp;fit=scale-down&amp;width=300">' +
						'</div>' +
						'<div class="promo-box__content o-expander__content">' +
						'<div class="promo-box__content__initial"><p><strong>Breakthrough:</strong> “Closing our first seed round in 10 days three times oversubscribed gave us momentum [to carry through] to the execution of our strategy and into the IPO.”</p>' +
						'<p><strong>Best mentor:</strong> “Chris Baohm, my boss at Gresham Partners in Australia . . . made me understand the importance of breaking down complex situations into the core commercial objectives.”</p></div>' +
						'<div class="promo-box__content__extension"><p><strong>Biggest mistake:</strong> “It became very clear that we needed a strong team with us who we could trust to navigate the huge due diligence tasks we had in several countries, in a different language.”</p>' +
						'<p><strong>Networking:</strong> “Wherever possible, and especially in Latin America, meet in person. Regardless of how good tech is, a face-to-face meeting is irreplaceable.”</p></div></div>' +
						'<button class="o-expander__toggle o--if-js" data-trackable="expander-toggle"></button>' +
					'</div>' +
				'</aside>' +
				'<aside class="promo-box ng-inline-element" data-trackable="promobox" role="complementary">' +
					'<div class="promo-box__wrapper">' +
						'<div class="promo-box__title"><div class="promo-box__title__name">Tatomer Riesling 2012</div></div>' +
						'<div class="promo-box__headline">Greece debt crisis</div>' +
						'<div class="promo-box__image">' +
							'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http://com.ft.imagepublish.prod.s3.amazonaws.com/1871b094-3b7d-11e5-bbd1-b37bc06f590c?source=next&amp;fit=scale-down&amp;width=300">' +
						'</div>' +
						'<div class="promo-box__content">' +
						'<div class="promo-box__content__initial"><p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (£26.95, Roberson)</p></div></div>' +
					'</div>' +
				'</aside>\n'
			);
		});
	});

	it('should not strip out text in a headline before a link', function() {
		return transform(
			'<promo-box>' +
				'<promo-title><p>Series: China Great Game</p></promo-title>' +
				'<promo-headline><p>As China seeks to expand its sphere of influence, it is likely to encounter significant resistance. <a href="http://www.ft.com/indepth/china-great-game" title="Chinas Great Game in depth">Read more</a> </p></promo-headline>' +
				'<promo-intro><p><a href="/content/6e098274-587a-11e5-a28b-50226830d644">Road to a new empire </a> <br/>A modern-day Silk route is Xi Jinping’s signature foreign policy. <a href="/content/6e098274-587a-11e5-a28b-50226830d644">Read more </a> </p></promo-intro>' +
			'</promo-box>'
		)
		.then(function(transformedXml) {
			transformedXml.should.equal(
				'<aside class="promo-box ng-inline-element" data-trackable="promobox" role="complementary">' +
					'<div class="promo-box__wrapper">' +
						'<div class="promo-box__title"><div class="promo-box__title__name">Series: China Great Game</div></div>' +
						'<div class="promo-box__headline">As China seeks to expand its sphere of influence, it is likely to encounter significant resistance. <a href="http://www.ft.com/indepth/china-great-game" data-trackable="link">Read more</a> </div>' +
						'<div class="promo-box__content">' +
							'<div class="promo-box__content__initial"><p><a href="/content/6e098274-587a-11e5-a28b-50226830d644" data-trackable="link">Road to a new empire </a> <br>A modern-day Silk route is Xi Jinping’s signature foreign policy. <a href="/content/6e098274-587a-11e5-a28b-50226830d644" data-trackable="link">Read more </a> </p></div>' +
							'</div>' +
					'</div>' +
				'</aside>\n'
			);
		});
	});

	it('should accept a title without <p> element inside it', function() {
		return transform(
			'<promo-box>' +
				'<promo-title><b>CV</b></promo-title>' +
				'<promo-headline><p>This is the headline</p></promo-headline>' +
				'<promo-intro><p>Here is some content</p></promo-intro>' +
			'</promo-box>'
		)
		.then(function(transformedXml) {
			transformedXml.should.equal(
				'<aside class="promo-box ng-inline-element" data-trackable="promobox" role="complementary">' +
					'<div class="promo-box__wrapper">' +
						'<div class="promo-box__title"><div class="promo-box__title__name"><b>CV</b></div></div>' +
						'<div class="promo-box__headline">This is the headline</div>' +
						'<div class="promo-box__content">' +
							'<div class="promo-box__content__initial"><p>Here is some content</p></div>' +
						'</div>' +
					'</div>' +
				'</aside>\n'
			);
		});
	});

});
