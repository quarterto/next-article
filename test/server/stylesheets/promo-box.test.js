/* global describe, it */

'use strict';

var transform = require('./transform-helper');
require('chai').should();

describe('Promo-boxes', function() {

	it('should transform to promo box, inline, no expander - 1 para, 20 words, image', function() {
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
				'<aside class="c-box c-box--inline u-border--all" data-trackable="promobox" role="complementary">' +
					'<div class="c-box--title"><div class="c-box--title__text u-background-color--pink">Tatomer Riesling 2012</div></div>' +
					'<div class="aside--headline u-margin--left-right">Greece debt crisis</div>' +
					'<div class="aside--image">' +
						'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http://com.ft.imagepublish.prod.s3.amazonaws.com/1871b094-3b7d-11e5-bbd1-b37bc06f590c?source=next&amp;fit=scale-down&amp;width=470">' +
					'</div>' +
					'<div class="aside--content u-margin--left-right">' +
						'<p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (£26.95, Roberson)</p>' +
					'</div>' +
				'</aside>\n'
			);
		});
	});

	it('should transform to promo box, inline, no expander - 1 para, 60 words, image', function() {
		return transform(
			'<promo-box>' +
				'<promo-title><p>Tatomer Riesling 2012</p></promo-title>' +
				'<promo-headline><p>Greece debt crisis</p></promo-headline>' +
				'<promo-image><img src="http://com.ft.imagepublish.prod.s3.amazonaws.com/1871b094-3b7d-11e5-bbd1-b37bc06f590c" /></promo-image>' +
				'<promo-intro><p>I am trying to make this paragraph into a long paragraph of sixty words. Sixty words is quite long for a paragraph and I would have hope it was against journalistic standars to write one so long in a promo box. However, journalists and editors are a law unto themselves. Just nine more measly words needed. That should do it.</p></promo-intro>' +
			'</promo-box>'
		)
		.then(function (transformedXml) {
			transformedXml.should.equal(
				'<aside class="c-box c-box--inline u-border--all" data-trackable="promobox" role="complementary">' +
					'<div class="c-box--title"><div class="c-box--title__text u-background-color--pink">Tatomer Riesling 2012</div></div>' +
					'<div class="aside--headline u-margin--left-right">Greece debt crisis</div>' +
					'<div class="aside--image">' +
						'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http://com.ft.imagepublish.prod.s3.amazonaws.com/1871b094-3b7d-11e5-bbd1-b37bc06f590c?source=next&amp;fit=scale-down&amp;width=470">' +
					'</div>' +
					'<div class="aside--content u-margin--left-right">' +
						'<p>I am trying to make this paragraph into a long paragraph of sixty words. Sixty words is quite long for a paragraph and I would have hope it was against journalistic standars to write one so long in a promo box. However, journalists and editors are a law unto themselves. Just nine more measly words needed. That should do it.</p>' +
					'</div>' +
				'</aside>\n'
			);
		});
	});

	it('should transform to inline promo box, no expander - 5 paras, 15 words, no image', function() {
		return transform(
			'<promo-box>' +
				'<promo-title><p>Tatomer Riesling 2012</p></promo-title>' +
				'<promo-headline><p>Greece debt crisis</p></promo-headline>' +
				'<promo-intro><p>The first paragraph</p>' +
				'<p>The second paragraph</p>' +
				'<p>The third paragraph</p>' +
				'<p>The fourth paragraph</p>' +
				'<p>The fifth paragraph</p></div>' +
				'</promo-intro>' +
			'</promo-box>'
		)
		.then(function (transformedXml) {
			transformedXml.should.equal(
				'<aside class="c-box c-box--inline u-border--all" data-trackable="promobox" role="complementary">' +
					'<div class="c-box--title"><div class="c-box--title__text u-background-color--pink">Tatomer Riesling 2012</div></div>' +
					'<div class="aside--headline u-margin--left-right">Greece debt crisis</div>' +
					'<div class="aside--content o-expander__content u-margin--left-right">' +
						'<p>The first paragraph</p>' +
						'<p>The second paragraph</p>' +
						'<p>The third paragraph</p>' +
						'<div class="aside--content__extension">' +
							'<p>The fourth paragraph</p>' +
							'<p>The fifth paragraph</p>' +
						'</div>' +
					'</div>' +
					'<button class="o-expander__toggle o--if-js u-margin--left-right" data-trackable="expander-toggle"></button>' +
				'</aside>\n'
			);
		});
	});

	it('should transform to promo box - inline, expander - 4 paragraphs, 60 words, with image', function () {
		return transform(
			'<promo-box>' +
				'<promo-title><p>Tatomer Riesling 2012</p></promo-title>' +
				'<promo-headline><p>Greece debt crisis</p></promo-headline>' +
				'<promo-image><img src="http://com.ft.imagepublish.prod.s3.amazonaws.com/1871b094-3b7d-11e5-bbd1-b37bc06f590c" /></promo-image>' +
				'<promo-intro><p><strong>Breakthrough:</strong> “Closing our first seed round in 10 days three times oversubscribed gave us momentum.”</p>' +
				'<p><strong>Best mentor:</strong> “Chris Baohm, my boss at Gresham Partners in Australia . . . made me understand the importance of breaking.”</p>' +
				'<p><strong>Biggest mistake:</strong> “It became very clear that we needed a strong team with us.”</p>' +
				'<p><strong>Networking:</strong> “Wherever possible, and especially in Latin America, meet in person. Regardless of how good tech is.”</p></promo-intro>' +
			'</promo-box>'
		)
		.then(function (transformedXml) {
			transformedXml.should.equal(
				'<aside class="c-box c-box--inline u-border--all o-expander" data-trackable="promobox" role="complementary" data-o-component="o-expander" data-o-expander-shrink-to="0" data-o-expander-count-selector=".aside--content__extension">' +
					'<div class="c-box--title"><div class="c-box--title__text u-background-color--pink">Tatomer Riesling 2012</div></div>' +
					'<div class="aside--headline u-margin--left-right">Greece debt crisis</div>' +
					'<div class="aside--image">' +
						'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http://com.ft.imagepublish.prod.s3.amazonaws.com/1871b094-3b7d-11e5-bbd1-b37bc06f590c?source=next&amp;fit=scale-down&amp;width=470">' +
					'</div>' +
					'<div class="aside--content o-expander__content u-margin--left-right">' +
						'<p><strong>Breakthrough:</strong> “Closing our first seed round in 10 days three times oversubscribed gave us momentum.”</p>' +
						'<p><strong>Best mentor:</strong> “Chris Baohm, my boss at Gresham Partners in Australia . . . made me understand the importance of breaking.”</p>' +
						'<p><strong>Biggest mistake:</strong> “It became very clear that we needed a strong team with us.”</p>' +
						'<div class="aside--content__extension">' +
							'<p><strong>Networking:</strong> “Wherever possible, and especially in Latin America, meet in person. Regardless of how good tech is.”</p>' +
						'</div>' +
					'</div>' +
					'<button class="o-expander__toggle o--if-js u-margin--left-right" data-trackable="expander-toggle"></button>' +
				'</aside>\n'
			);
		});
	});

	it('should transform to promo box - inline, expander - 4 paragraphs, 111 words, no image', function () {
		return transform(
			'<promo-box>' +
				'<promo-title><p>Tatomer Riesling 2012</p></promo-title>' +
				'<promo-headline><p>Greece debt crisis</p></promo-headline>' +
				'<promo-intro><p><strong>Breakthrough:</strong> “Closing our first seed round in 10 days three times oversubscribed gave us momentum [to carry through] to the execution of our strategy and into the IPO.”</p>' +
				'<p><strong>Best mentor:</strong> “Chris Baohm, my boss at Gresham Partners in Australia . . . made me understand the importance of breaking down complex situations into the core commercial objectives.”</p>' +
				'<p><strong>Biggest mistake:</strong> “It became very clear that we needed a strong team with us who we could trust to navigate the huge due diligence tasks we had in several countries, in a different language.”</p>' +
				'<p><strong>Networking:</strong> “Wherever possible, and especially in Latin America, meet in person. Regardless of how good tech is, a face-to-face meeting is irreplaceable.”</p></promo-intro>' +
			'</promo-box>'
		)
		.then(function (transformedXml) {
			transformedXml.should.equal(
				'<aside class="c-box c-box--inline u-border--all o-expander" data-trackable="promobox" role="complementary" data-o-component="o-expander" data-o-expander-shrink-to="0" data-o-expander-count-selector=".aside--content__extension">' +
					'<div class="c-box--title"><div class="c-box--title__text u-background-color--pink">Tatomer Riesling 2012</div></div>' +
					'<div class="aside--headline u-margin--left-right">Greece debt crisis</div>' +
					'<div class="aside--content o-expander__content u-margin--left-right">' +
						'<p><strong>Breakthrough:</strong> “Closing our first seed round in 10 days three times oversubscribed gave us momentum [to carry through] to the execution of our strategy and into the IPO.”</p>' +
						'<p><strong>Best mentor:</strong> “Chris Baohm, my boss at Gresham Partners in Australia . . . made me understand the importance of breaking down complex situations into the core commercial objectives.”</p>' +
						'<p><strong>Biggest mistake:</strong> “It became very clear that we needed a strong team with us who we could trust to navigate the huge due diligence tasks we had in several countries, in a different language.”</p>' +
						'<div class="aside--content__extension">' +
							'<p><strong>Networking:</strong> “Wherever possible, and especially in Latin America, meet in person. Regardless of how good tech is, a face-to-face meeting is irreplaceable.”</p>' +
						'</div>' +
					'</div>' +
					'<button class="o-expander__toggle o--if-js u-margin--left-right" data-trackable="expander-toggle"></button>' +
				'</aside>\n'
			);
		});
	});

	it('should output no default title if no title provided', function () {
		return transform(
			'<promo-box>' +
				'<promo-headline><p>Greece debt crisis</p></promo-headline>' +
				'<promo-image><img src="http://com.ft.imagepublish.prod.s3.amazonaws.com/1871b094-3b7d-11e5-bbd1-b37bc06f590c" /></promo-image>' +
				'<promo-intro><p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (£26.95, Roberson)</p></promo-intro>' +
			'</promo-box>'
		)
		.then(function (transformedXml) {
			transformedXml.should.equal(
				'<aside class="c-box c-box--inline u-border--all" data-trackable="promobox" role="complementary">' +
					'<div class="aside--headline u-margin--left-right">Greece debt crisis</div>' +
					'<div class="aside--image">' +
						'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http://com.ft.imagepublish.prod.s3.amazonaws.com/1871b094-3b7d-11e5-bbd1-b37bc06f590c?source=next&amp;fit=scale-down&amp;width=470">' +
					'</div>' +
					'<div class="aside--content u-margin--left-right">' +
						'<p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (£26.95, Roberson)</p>' +
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
				'<aside class="c-box c-box--inline u-border--all" data-trackable="promobox" role="complementary">' +
					'<div class="c-box--title"><div class="c-box--title__text u-background-color--pink"><a href="/c9175806-3054-11e5-8873-775ba7c2ea3d" data-trackable="link">Greece crisis tests start-ups’ staying power</a> </div></div>' +
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
				'<aside class="c-box c-box--inline u-border--all" data-trackable="promobox" role="complementary">' +
					'<div class="aside--headline u-margin--left-right"><a href="/c9175806-3054-11e5-8873-775ba7c2ea3d" data-trackable="link">Greece crisis tests start-ups’ staying power</a></div>' +
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
				'<aside class="c-box c-box--inline u-border--all o-expander" data-trackable="promobox" role="complementary" data-o-component="o-expander" data-o-expander-shrink-to="0" data-o-expander-count-selector=".aside--content__extension">' +
					'<div class="c-box--title"><div class="c-box--title__text u-background-color--pink">Tatomer Riesling 2012</div></div>' +
					'<div class="aside--headline u-margin--left-right">Greece debt crisis</div>' +
					'<div class="aside--image">' +
						'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http://com.ft.imagepublish.prod.s3.amazonaws.com/1871b094-3b7d-11e5-bbd1-b37bc06f590c?source=next&amp;fit=scale-down&amp;width=470">' +
					'</div>' +
					'<div class="aside--content o-expander__content u-margin--left-right">' +
						'<p><strong>Breakthrough:</strong> “Closing our first seed round in 10 days three times oversubscribed gave us momentum [to carry through] to the execution of our strategy and into the IPO.”</p>' +
						'<p><strong>Best mentor:</strong> “Chris Baohm, my boss at Gresham Partners in Australia . . . made me understand the importance of breaking down complex situations into the core commercial objectives.”</p>' +
						'<p><strong>Biggest mistake:</strong> “It became very clear that we needed a strong team with us who we could trust to navigate the huge due diligence tasks we had in several countries, in a different language.”</p>' +
						'<div class="aside--content__extension"><p><strong>Networking:</strong> “Wherever possible, and especially in Latin America, meet in person. Regardless of how good tech is, a face-to-face meeting is irreplaceable.”</p></div>' +
					'</div>' +
					'<button class="o-expander__toggle o--if-js u-margin--left-right" data-trackable="expander-toggle"></button>' +
				'</aside>' +
				'<aside class="c-box c-box--inline u-border--all" data-trackable="promobox" role="complementary">' +
					'<div class="c-box--title"><div class="c-box--title__text u-background-color--pink">Tatomer Riesling 2012</div></div>' +
					'<div class="aside--headline u-margin--left-right">Greece debt crisis</div>' +
					'<div class="aside--image">' +
						'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http://com.ft.imagepublish.prod.s3.amazonaws.com/1871b094-3b7d-11e5-bbd1-b37bc06f590c?source=next&amp;fit=scale-down&amp;width=470">' +
					'</div>' +
					'<div class="aside--content u-margin--left-right">' +
					'<p>Graham Tatomer worked at Austrian Riesling producer Emmerich Knoll and now fashions this example from the old vines of the Kick-on Ranch in Santa Barbara (£26.95, Roberson)</p></div>' +
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
				'<aside class="c-box c-box--inline u-border--all" data-trackable="promobox" role="complementary">' +
					'<div class="c-box--title"><div class="c-box--title__text u-background-color--pink">Series: China Great Game</div></div>' +
					'<div class="aside--headline u-margin--left-right">As China seeks to expand its sphere of influence, it is likely to encounter significant resistance. <a href="http://www.ft.com/indepth/china-great-game" data-trackable="link">Read more</a> </div>' +
					'<div class="aside--content u-margin--left-right">' +
						'<p><a href="/content/6e098274-587a-11e5-a28b-50226830d644" data-trackable="link">Road to a new empire </a> <br>A modern-day Silk route is Xi Jinping’s signature foreign policy. <a href="/content/6e098274-587a-11e5-a28b-50226830d644" data-trackable="link">Read more </a> </p>' +
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
				'<aside class="c-box c-box--inline u-border--all" data-trackable="promobox" role="complementary">' +
					'<div class="c-box--title"><div class="c-box--title__text u-background-color--pink"><b>CV</b></div></div>' +
					'<div class="aside--headline u-margin--left-right">This is the headline</div>' +
					'<div class="aside--content u-margin--left-right"><p>Here is some content</p></div>' +
				'</aside>\n'
			);
		});
	});

	it('should leave an image of less than 300px width at actual size', function () {
		return transform(
			'<promo-box>' +
				'<promo-title><p>Tatomer Riesling 2012</p></promo-title>' +
				'<promo-headline><p>Greece debt crisis</p></promo-headline>' +
				'<promo-image><img src="http://com.ft.imagepublish.prod.s3.amazonaws.com/79ac73d6-7718-11e5-933d-efcdc3c11c89" alt="start-up" longdesc="" width="167" height="96" /></promo-image>' +
				'<promo-intro><p>That should do it.</p></promo-intro>' +
			'</promo-box>'
		)
		.then(function(transformedXml) {
			transformedXml.should.equal(
				'<aside class="c-box c-box--inline u-border--all" data-trackable="promobox" role="complementary">' +
					'<div class="c-box--title"><div class="c-box--title__text u-background-color--pink">Tatomer Riesling 2012</div></div>' +
					'<div class="aside--headline u-margin--left-right">Greece debt crisis</div>' +
					'<div class="aside--image u-margin--left-right"><div class="article-image__placeholder" style="padding-top:96px;">' +
						'<img alt="start-up" src="https://next-geebee.ft.com/image/v1/images/raw/http://com.ft.imagepublish.prod.s3.amazonaws.com/79ac73d6-7718-11e5-933d-efcdc3c11c89?source=next&amp;fit=scale-down&amp;width=167"></div></div>' +
					'<div class="aside--content u-margin--left-right"><p>That should do it.</p></div>' +
				'</aside>\n'
			);
		});

	});

});
