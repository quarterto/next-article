/* global describe, it */
'use strict';

var transform = require('./transform-helper');
require('chai').should();

describe('Promo-boxes', function() {

	describe('Promo-boxes - new', function() {

		it('should should transform to promo box - short version', function() {
			return transform(
				'<promo-box>' +
					'<promo-title><p>Tatomer Riesling 2012</p></promo-title>' +
					'<promo-headline><p>Greece debt crisis</p></promo-headline>' +
					'<promo-image><ft-content type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/e7b203ac-2351-11e5-23e5-e651ba9c5bc5" data-embedded="true"></ft-content></promo-image>' +
					'<promo-intro><p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (£26.95, Roberson)</p></promo-intro>' +
				'</promo-box>',
				{
					promoBoxNewStyling: 1
				}
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<aside class="promo-box ng-pull-out ng-inline-element" data-trackable="promobox" role="complementary">' +
							'<div class="promo-box__title__wrapper"><h3 class="promo-box__title">Tatomer Riesling 2012</h3></div>' +
							'<h4 class="promo-box__headline">Greece debt crisis</h4>' +
							'<picture data-image-set-id="e7b203ac-2351-11e5-23e5-e651ba9c5bc5" class="article__image n-image">' +
								'<source data-image-size="280" media="(min-width: 490px)"></source>' +
								'<img data-image-type="srcset" data-image-size="400" class="n-image__img" alt="">' +
							'</picture>' +
							'<div class="promo-box__content">' +
							'<div class="promo-box__content__initial"><p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (£26.95, Roberson)</p></div></div>' +
						'</aside>' +
					'</body>\n'
				);
			});
		});

		it('should transform to promo box - long version - no expander', function () {
			return transform(
				'<promo-box>' +
					'<promo-title><p>Tatomer Riesling 2012</p></promo-title>' +
					'<promo-headline><p>Greece debt crisis</p></promo-headline>' +
					'<promo-image><ft-content type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/e7b203ac-2351-11e5-23e5-e651ba9c5bc5" data-embedded="true"></ft-content></promo-image>' +
					'<promo-intro><p><strong>Breakthrough:</strong> “Closing our first seed round in 10 days three times oversubscribed gave us momentum [to carry through] to the execution of our strategy and into the IPO.”</p>' +
					'<p><strong>Best mentor:</strong> “Chris Baohm, my boss at Gresham Partners in Australia . . . made me understand the importance of breaking down complex situations into the core commercial objectives.”</p></promo-intro>' +
				'</promo-box>',
				{
					promoBoxNewStyling: 1
				}
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<aside class="promo-box promo-box--long ng-pull-out ng-inline-element" data-trackable="promobox" role="complementary">' +
							'<div class="promo-box__title__wrapper"><h3 class="promo-box__title">Tatomer Riesling 2012</h3></div>' +
							'<h4 class="promo-box__headline">Greece debt crisis</h4>' +
							'<picture data-image-set-id="e7b203ac-2351-11e5-23e5-e651ba9c5bc5" class="article__image n-image">' +
								'<source data-image-size="280" media="(min-width: 490px)"></source>' +
								'<img data-image-type="srcset" data-image-size="400" class="n-image__img" alt="">' +
							'</picture>' +
							'<div class="promo-box__content">' +
							'<div class="promo-box__content__initial"><p><strong>Breakthrough:</strong> “Closing our first seed round in 10 days three times oversubscribed gave us momentum [to carry through] to the execution of our strategy and into the IPO.”</p>' +
							'<p><strong>Best mentor:</strong> “Chris Baohm, my boss at Gresham Partners in Australia . . . made me understand the importance of breaking down complex situations into the core commercial objectives.”</p></div></div>' +
						'</aside>' +
					'</body>\n'
				);
			});
		});

		it('should transform to promo box HTML - long version - with expander', function () {
			return transform(
				'<promo-box>' +
					'<promo-title><p>Tatomer Riesling 2012</p></promo-title>' +
					'<promo-headline><p>Greece debt crisis</p></promo-headline>' +
					'<promo-image><ft-content type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/2889cee2-2fc7-11e5-0fca-327ba7efe7b6" data-embedded="true"></ft-content></promo-image>' +
					'<promo-intro><p><strong>Breakthrough:</strong> “Closing our first seed round in 10 days three times oversubscribed gave us momentum [to carry through] to the execution of our strategy and into the IPO.”</p>' +
					'<p><strong>Best mentor:</strong> “Chris Baohm, my boss at Gresham Partners in Australia . . . made me understand the importance of breaking down complex situations into the core commercial objectives.”</p>' +
					'<p><strong>Biggest mistake:</strong> “It became very clear that we needed a strong team with us who we could trust to navigate the huge due diligence tasks we had in several countries, in a different language.”</p>' +
					'<p><strong>Networking:</strong> “Wherever possible, and especially in Latin America, meet in person. Regardless of how good tech is, a face-to-face meeting is irreplaceable.”</p></promo-intro>' +
				'</promo-box>',
				{
					promoBoxNewStyling: 1
				}
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
	  			'<body>' +
	          '<aside class="promo-box promo-box--long ng-pull-out ng-inline-element o-expander" data-trackable="promobox" role="complementary" data-o-component="o-expander" data-o-expander-shrink-to="0" data-o-expander-count-selector=".promo-box__content__extension">' +
	    				'<div class="promo-box__title__wrapper"><h3 class="promo-box__title">Tatomer Riesling 2012</h3></div>' +
	    				'<h4 class="promo-box__headline">Greece debt crisis</h4>' +
						'<picture data-image-set-id="2889cee2-2fc7-11e5-0fca-327ba7efe7b6" class="article__image n-image">' +
							'<source data-image-size="280" media="(min-width: 490px)"></source>' +
							'<img data-image-type="srcset" data-image-size="400" class="n-image__img" alt="">' +
						'</picture>' +
	    				'<div class="promo-box__content o-expander__content">' +
	    				'<div class="promo-box__content__initial"><p><strong>Breakthrough:</strong> “Closing our first seed round in 10 days three times oversubscribed gave us momentum [to carry through] to the execution of our strategy and into the IPO.”</p>' +
	    				'<p><strong>Best mentor:</strong> “Chris Baohm, my boss at Gresham Partners in Australia . . . made me understand the importance of breaking down complex situations into the core commercial objectives.”</p></div>' +
	    				'<div class="promo-box__content__extension"><p><strong>Biggest mistake:</strong> “It became very clear that we needed a strong team with us who we could trust to navigate the huge due diligence tasks we had in several countries, in a different language.”</p>' +
	    				'<p><strong>Networking:</strong> “Wherever possible, and especially in Latin America, meet in person. Regardless of how good tech is, a face-to-face meeting is irreplaceable.”</p></div></div>' +
	    				'<button class="o-expander__toggle o--if-js" data-trackable="expander-toggle"></button>' +
	    			'</aside>' +
	        '</body>\n'
			  );
	    });
	  });

		it('should output default title if no title provided', function () {
			return transform(
				'<promo-box>' +
					'<promo-headline><p>Greece debt crisis</p></promo-headline>' +
					'<promo-image><ft-content type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/2889cee2-2fc7-11e5-0fca-327ba7efe7b6" data-embedded="true"></ft-content></promo-image>' +
					'<promo-intro><p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (£26.95, Roberson)</p></promo-intro>' +
				'</promo-box>',
				{
					promoBoxNewStyling: 1
				}
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
				'<body>' +
					'<aside class="promo-box ng-pull-out ng-inline-element" data-trackable="promobox" role="complementary">' +
						'<div class="promo-box__title__wrapper"><h3 class="promo-box__title">Related Content</h3></div>' +
						'<h4 class="promo-box__headline">Greece debt crisis</h4>' +
						'<picture data-image-set-id="2889cee2-2fc7-11e5-0fca-327ba7efe7b6" class="article__image n-image">' +
							'<source data-image-size="280" media="(min-width: 490px)"></source>' +
							'<img data-image-type="srcset" data-image-size="400" class="n-image__img" alt="">' +
						'</picture>' +
						'<div class="promo-box__content">' +
						'<div class="promo-box__content__initial"><p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (£26.95, Roberson)</p></div></div>' +
					'</aside>' +
				'</body>\n'
			);
			});
		});

		it('should leave in any HTML in title (except wrapped p tag)', function () {
			return transform(
				'<promo-box>' +
					'<promo-title><p><ft-content type="http://www.ft.com/ontology/content/Article" url="http://api.ft.com/content/c9175806-3054-11e5-8873-775ba7c2ea3d">Greece crisis tests start-ups’ staying power</ft-content> </p></promo-title>' +
				'</promo-box>',
				{
					promoBoxNewStyling: 1
				}
			)
			.then(function(transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<aside class="promo-box ng-pull-out ng-inline-element" data-trackable="promobox" role="complementary">' +
							'<div class="promo-box__title__wrapper"><h3 class="promo-box__title"><a href="/c9175806-3054-11e5-8873-775ba7c2ea3d" data-trackable="link">Greece crisis tests start-ups’ staying power</a></h3></div>' +
						'</aside>' +
					'</body>\n'
				);
			});
		});

		it('should leave in any HTML in headline (except wrapped p tag)', function () {
			return transform(
				'<promo-box>' +
					'<promo-headline><p><ft-content type="http://www.ft.com/ontology/content/Article" url="http://api.ft.com/content/c9175806-3054-11e5-8873-775ba7c2ea3d">Greece crisis tests start-ups’ staying power</ft-content></p></promo-headline>' +
				'</promo-box>',
				{
					promoBoxNewStyling: 1
				}
			)
			.then(function(transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<aside class="promo-box ng-pull-out ng-inline-element" data-trackable="promobox" role="complementary">' +
							'<div class="promo-box__title__wrapper"><h3 class="promo-box__title">Related Content</h3></div>' +
							'<h4 class="promo-box__headline"><a href="/c9175806-3054-11e5-8873-775ba7c2ea3d" data-trackable="link">Greece crisis tests start-ups’ staying power</a></h4>' +
						'</aside>' +
					'</body>\n'
				);
			});
		});

		it('should handle two promoboxes with different attributes in the same xml', function() {
			return transform(
				'<promo-box>' +
					'<promo-title><p>Tatomer Riesling 2012</p></promo-title>' +
					'<promo-headline><p>Greece debt crisis</p></promo-headline>' +
					'<promo-image><ft-content type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/2889cee2-2fc7-11e5-0fca-327ba7efe7b6" data-embedded="true"></ft-content></promo-image>' +
					'<promo-intro><p><strong>Breakthrough:</strong> “Closing our first seed round in 10 days three times oversubscribed gave us momentum [to carry through] to the execution of our strategy and into the IPO.”</p>' +
					'<p><strong>Best mentor:</strong> “Chris Baohm, my boss at Gresham Partners in Australia . . . made me understand the importance of breaking down complex situations into the core commercial objectives.”</p>' +
					'<p><strong>Biggest mistake:</strong> “It became very clear that we needed a strong team with us who we could trust to navigate the huge due diligence tasks we had in several countries, in a different language.”</p>' +
					'<p><strong>Networking:</strong> “Wherever possible, and especially in Latin America, meet in person. Regardless of how good tech is, a face-to-face meeting is irreplaceable.”</p></promo-intro>' +
				'</promo-box>' +
				'<promo-box>' +
					'<promo-title><p>Tatomer Riesling 2012</p></promo-title>' +
					'<promo-headline><p>Greece debt crisis</p></promo-headline>' +
					'<promo-image><ft-content type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/e7b203ac-2351-11e5-23e5-e651ba9c5bc5" data-embedded="true"></ft-content></promo-image>' +
					'<promo-intro><p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (£26.95, Roberson)</p></promo-intro>' +
				'</promo-box>',
				{
					promoBoxNewStyling: 1
				}
			)
			.then(function(transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<aside class="promo-box promo-box--long ng-pull-out ng-inline-element o-expander" data-trackable="promobox" role="complementary" data-o-component="o-expander" data-o-expander-shrink-to="0" data-o-expander-count-selector=".promo-box__content__extension">' +
							'<div class="promo-box__title__wrapper"><h3 class="promo-box__title">Tatomer Riesling 2012</h3></div>' +
							'<h4 class="promo-box__headline">Greece debt crisis</h4>' +
							'<picture data-image-set-id="2889cee2-2fc7-11e5-0fca-327ba7efe7b6" class="article__image n-image">' +
								'<source data-image-size="280" media="(min-width: 490px)"></source>' +
								'<img data-image-type="srcset" data-image-size="400" class="n-image__img" alt="">' +
							'</picture>' +
							'<div class="promo-box__content o-expander__content">' +
							'<div class="promo-box__content__initial"><p><strong>Breakthrough:</strong> “Closing our first seed round in 10 days three times oversubscribed gave us momentum [to carry through] to the execution of our strategy and into the IPO.”</p>' +
							'<p><strong>Best mentor:</strong> “Chris Baohm, my boss at Gresham Partners in Australia . . . made me understand the importance of breaking down complex situations into the core commercial objectives.”</p></div>' +
							'<div class="promo-box__content__extension"><p><strong>Biggest mistake:</strong> “It became very clear that we needed a strong team with us who we could trust to navigate the huge due diligence tasks we had in several countries, in a different language.”</p>' +
							'<p><strong>Networking:</strong> “Wherever possible, and especially in Latin America, meet in person. Regardless of how good tech is, a face-to-face meeting is irreplaceable.”</p></div></div>' +
							'<button class="o-expander__toggle o--if-js" data-trackable="expander-toggle"></button>' +
						'</aside>' +
						'<aside class="promo-box ng-pull-out ng-inline-element" data-trackable="promobox" role="complementary">' +
							'<div class="promo-box__title__wrapper"><h3 class="promo-box__title">Tatomer Riesling 2012</h3></div>' +
							'<h4 class="promo-box__headline">Greece debt crisis</h4>' +
							'<picture data-image-set-id="e7b203ac-2351-11e5-23e5-e651ba9c5bc5" class="article__image n-image">' +
								'<source data-image-size="280" media="(min-width: 490px)"></source>' +
								'<img data-image-type="srcset" data-image-size="400" class="n-image__img" alt="">' +
							'</picture>' +
							'<div class="promo-box__content">' +
							'<div class="promo-box__content__initial"><p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (£26.95, Roberson)</p></div></div>' +
						'</aside>' +
					'</body>\n'
				);
			});
		});

	});

	describe('Promo-boxes - original', function() {

		it('should transform to promo box HTML', function () {
			return transform(
				'<promo-box>' +
					'<promo-title><p>Tatomer Riesling 2012</p></promo-title>' +
					'<promo-headline><p>Greece debt crisis</p></promo-headline>' +
					'<promo-image><ft-content data-embedded="true" type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/9ccaf9da-cde2-11e4-0f22-978e959e1c97"></ft-content></promo-image>' +
					'<promo-intro><p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (£26.95, Roberson)</p></promo-intro>' +
				'</promo-box>'
			)
			.then(function(transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<aside class="article__promo-box ng-pull-out ng-inline-element" data-trackable="promobox" role="complementary">' +
							'<h3 class="article__promo-box__title">Tatomer Riesling 2012</h3>' +
							'<h4 class="article__promo-box__headline">Greece debt crisis</h4>' +
							'<picture data-image-set-id="9ccaf9da-cde2-11e4-0f22-978e959e1c97" class="article__image n-image">' +
								'<source data-image-size="280" media="(min-width: 490px)"></source>' +
								'<img data-image-type="srcset" data-image-size="400" class="n-image__img" alt="">' +
							'</picture>' +
							'<div class="article__promo-box__content"><p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (£26.95, Roberson)</p></div>' +
						'</aside>' +
					'</body>\n'
				);
			});
		});

		it('should handle no promo-box title', function () {
			return transform(
				'<promo-box>' +
					'<promo-headline><p>Greece debt crisis</p></promo-headline>' +
					'<promo-image><ft-content data-embedded="true" type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/9ccaf9da-cde2-11e4-0f22-978e959e1c97"></ft-content></promo-image>' +
					'<promo-intro><p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (£26.95, Roberson)</p></promo-intro>' +
				'</promo-box>'
			)
			.then(function(transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<aside class="article__promo-box ng-pull-out ng-inline-element" data-trackable="promobox" role="complementary">' +
							'<h4 class="article__promo-box__headline">Greece debt crisis</h4>' +
							'<picture data-image-set-id="9ccaf9da-cde2-11e4-0f22-978e959e1c97" class="article__image n-image">' +
								'<source data-image-size="280" media="(min-width: 490px)"></source>' +
								'<img data-image-type="srcset" data-image-size="400" class="n-image__img" alt="">' +
							'</picture>' +
							'<div class="article__promo-box__content"><p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (£26.95, Roberson)</p></div>' +
						'</aside>' +
					'</body>\n'
				);
			});
		});

		it('should handle no promo-box headline', function () {
			return transform(
				'<promo-box>' +
					'<promo-title><p>Tatomer Riesling 2012</p></promo-title>' +
					'<promo-image><ft-content data-embedded="true" type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/9ccaf9da-cde2-11e4-0f22-978e959e1c97"></ft-content></promo-image>' +
					'<promo-intro><p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (£26.95, Roberson)</p></promo-intro>' +
				'</promo-box>'
			)
			.then(function(transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<aside class="article__promo-box ng-pull-out ng-inline-element" data-trackable="promobox" role="complementary">' +
							'<h3 class="article__promo-box__title">Tatomer Riesling 2012</h3>' +
							'<picture data-image-set-id="9ccaf9da-cde2-11e4-0f22-978e959e1c97" class="article__image n-image">' +
								'<source data-image-size="280" media="(min-width: 490px)"></source>' +
								'<img data-image-type="srcset" data-image-size="400" class="n-image__img" alt="">' +
							'</picture>' +
							'<div class="article__promo-box__content"><p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (£26.95, Roberson)</p></div>' +
						'</aside>' +
					'</body>\n'
				);
			});
		});

		it('should handle no promo-box image', function () {
			return transform(
				'<promo-box>' +
					'<promo-title><p>Tatomer Riesling 2012</p></promo-title>' +
					'<promo-headline><p>Greece debt crisis</p></promo-headline>' +
					'<promo-intro><p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (£26.95, Roberson)</p></promo-intro>' +
				'</promo-box>'
			)
			.then(function(transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<aside class="article__promo-box ng-pull-out ng-inline-element" data-trackable="promobox" role="complementary">' +
							'<h3 class="article__promo-box__title">Tatomer Riesling 2012</h3>' +
							'<h4 class="article__promo-box__headline">Greece debt crisis</h4>' +
							'<div class="article__promo-box__content"><p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (£26.95, Roberson)</p></div>' +
						'</aside>' +
					'</body>\n'
				);
			});
		});

		it('should handle no promo-box intro', function () {
			return transform(
				'<promo-box>' +
					'<promo-title><p>Tatomer Riesling 2012</p></promo-title>' +
					'<promo-headline><p>Greece debt crisis</p></promo-headline>' +
					'<promo-image><ft-content data-embedded="true" type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/9ccaf9da-cde2-11e4-0f22-978e959e1c97"></ft-content></promo-image>' +
				'</promo-box>'
			)
			.then(function(transformedXml) {
				transformedXml.should.equal(
				'<body>' +
					'<aside class="article__promo-box ng-pull-out ng-inline-element" data-trackable="promobox" role="complementary">' +
						'<h3 class="article__promo-box__title">Tatomer Riesling 2012</h3>' +
						'<h4 class="article__promo-box__headline">Greece debt crisis</h4>' +
						'<picture data-image-set-id="9ccaf9da-cde2-11e4-0f22-978e959e1c97" class="article__image n-image">' +
							'<source data-image-size="280" media="(min-width: 490px)"></source>' +
							'<img data-image-type="srcset" data-image-size="400" class="n-image__img" alt="">' +
						'</picture>' +
					'</aside>' +
				'</body>\n'
				);
			});
		});

		it('should leave in any HTML in title (except wrapped p tag)', function () {
			return transform(
				'<promo-box>' +
					'<promo-title><p><ft-content type="http://www.ft.com/ontology/content/Article" url="http://api.ft.com/content/c9175806-3054-11e5-8873-775ba7c2ea3d">Greece crisis tests start-ups’ staying power</ft-content> </p></promo-title>' +
				'</promo-box>'
			)
			.then(function(transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<aside class="article__promo-box ng-pull-out ng-inline-element" data-trackable="promobox" role="complementary">' +
							'<h3 class="article__promo-box__title"><a href="/c9175806-3054-11e5-8873-775ba7c2ea3d" data-trackable="link">Greece crisis tests start-ups’ staying power</a></h3>' +
						'</aside>' +
					'</body>\n'
				);
			});
		});

		it('should leave in any HTML in headline (except wrapped p tag)', function () {
			return transform(
				'<promo-box>' +
					'<promo-headline><p><ft-content type="http://www.ft.com/ontology/content/Article" url="http://api.ft.com/content/c9175806-3054-11e5-8873-775ba7c2ea3d">Greece crisis tests start-ups’ staying power</ft-content></p></promo-headline>' +
				'</promo-box>'
			)
			.then(function(transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<aside class="article__promo-box ng-pull-out ng-inline-element" data-trackable="promobox" role="complementary">' +
							'<h4 class="article__promo-box__headline"><a href="/c9175806-3054-11e5-8873-775ba7c2ea3d" data-trackable="link">Greece crisis tests start-ups’ staying power</a></h4>' +
						'</aside>' +
					'</body>\n'
				);
			});
		});


	});

});
