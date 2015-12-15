/* global describe, it */
'use strict';

const transform = require('./transform-helper');
require('chai').should();

describe('Related Box', () => {

	//TO DO once we get the article fetched live, this will no longer need the link to be decorated
	it('should put in the appropriate classes and a link for a related box that is an article with url but no mark up', () => {
		return transform(
			'<ft-related type="http://www.ft.com/ontology/content/Article" url="http://api.ft.com/content/e539eab8-8c83-11e5-8be4-3506bf20cc2b"></ft-related>'
		)
		.then(transformedXml => {
			transformedXml.should.equal(
				'<aside data-trackable="related-box" role="complementary" class="related-box ng-inline-element related-box__article to-fetch" uuid="e539eab8-8c83-11e5-8be4-3506bf20cc2b">' +
					'<div class="related-box__wrapper"><div><a href="/content/e539eab8-8c83-11e5-8be4-3506bf20cc2b" class="related-box__link" data-trackable="link-read-more">Read more</a></div></div>' +
				'</aside>\n'
			);
		});
	});

	it('should put in the appropriate mark up for a related box that is not an article with existing mark up - no title', () => {
		return transform(
			'<ft-related url="https://live.ft.com/Events/2015/FT-Property-Summit-2015">' +
				'<media><img src="http://com.ft.imagepublish.prod.s3.amazonaws.com/aa4eec2e-1bfd-11e5-8201-cbdb03d71480" alt="Housing market economic dashboard" longdesc="" width="2048" height="1152" /></media>' +
				'<headline>9th Annual Property Summit</headline>' +
				'<intro><p>The Financial Times is delighted to present the 9th annual <strong>FT Property Summit</strong></p>' +
				'<p>This will bring together global investors, occupiers, lenders and developers to explore the opportunities available in the UK commercial property market</p></intro>' +
			'</ft-related>'
		)
		.then(transformedXml => {
			transformedXml.should.equal(
				'<aside data-trackable="related-box" role="complementary" class="related-box ng-inline-element">' +
					'<div class="related-box__wrapper">' +
						'<div class="related-box__headline"><a class="related-box__headline--link" data-trackable="link-headline" href="https://live.ft.com/Events/2015/FT-Property-Summit-2015">9th Annual Property Summit</a></div>' +
						'<div class="related-box__image"><a class="related-box__image--link" data-trackable="link-image" href="https://live.ft.com/Events/2015/FT-Property-Summit-2015"><div class="article-image__placeholder" style="padding-top:56.25%;">' +
						'<img alt="Housing market economic dashboard" src="https://next-geebee.ft.com/image/v1/images/raw/http://com.ft.imagepublish.prod.s3.amazonaws.com/aa4eec2e-1bfd-11e5-8201-cbdb03d71480?source=next&amp;fit=scale-down&amp;width=300"></div></a></div>' +
						'<div class="related-box__content"><p>The Financial Times is delighted to present the 9th annual <strong>FT Property Summit</strong></p>' +
						'<p>This will bring together global investors, occupiers, lenders and developers to explore the opportunities available in the UK commercial property market</p></div>' +
					'<div><a href="https://live.ft.com/Events/2015/FT-Property-Summit-2015" class="related-box__link" data-trackable="link-read-more">Read more</a></div></div>' +
				'</aside>\n'
			);
		});
	});

	it('should put in the appropriate mark up for a related box that is not an article with existing mark up - no url', () => {
		return transform(
			'<ft-related>' +
				'<media><img src="http://com.ft.imagepublish.prod.s3.amazonaws.com/aa4eec2e-1bfd-11e5-8201-cbdb03d71480" alt="Housing market economic dashboard" longdesc="" width="2048" height="1152" /></media>' +
				'<headline>9th Annual Property Summit</headline>' +
				'<intro><p>The Financial Times is delighted to present the 9th annual <strong>FT Property Summit</strong></p>' +
				'<p>This will bring together global investors, occupiers, lenders and developers to explore the opportunities available in the UK commercial property market</p></intro>' +
			'</ft-related>'
		)
		.then(transformedXml => {
			transformedXml.should.equal(
				'<aside data-trackable="related-box" role="complementary" class="related-box ng-inline-element">' +
					'<div class="related-box__wrapper">' +
						'<div class="related-box__headline">9th Annual Property Summit</div>' +
						'<div class="related-box__image"><div class="article-image__placeholder" style="padding-top:56.25%;">' +
						'<img alt="Housing market economic dashboard" src="https://next-geebee.ft.com/image/v1/images/raw/http://com.ft.imagepublish.prod.s3.amazonaws.com/aa4eec2e-1bfd-11e5-8201-cbdb03d71480?source=next&amp;fit=scale-down&amp;width=300"></div></div>' +
						'<div class="related-box__content"><p>The Financial Times is delighted to present the 9th annual <strong>FT Property Summit</strong></p>' +
						'<p>This will bring together global investors, occupiers, lenders and developers to explore the opportunities available in the UK commercial property market</p></div>' +
					'</div>' +
				'</aside>\n'
			);
		});
	});

	it('should put in the appropriate mark up for a related box that is not an article with existing mark up - with title', () => {
		return transform(
			'<ft-related url="https://live.ft.com/Events/2015/FT-Property-Summit-2015">' +
				'<media><img src="http://com.ft.imagepublish.prod.s3.amazonaws.com/aa4eec2e-1bfd-11e5-8201-cbdb03d71480" alt="Housing market economic dashboard" longdesc="" width="2048" height="1152" /></media>' +
				'<title>FT Property Summit 2015</title>' +
				'<headline>9th Annual Property Summit</headline>' +
				'<intro><p>The Financial Times is delighted to present the 9th annual <strong>FT Property Summit</strong></p>' +
				'<p>This will bring together global investors, occupiers, lenders and developers to explore the opportunities available in the UK commercial property market</p></intro>' +
			'</ft-related>'
		)
		.then(transformedXml => {
			transformedXml.should.equal(
				'<aside data-trackable="related-box" role="complementary" class="related-box ng-inline-element">' +
					'<div class="related-box__wrapper">' +
						'<div class="related-box__title"><div class="related-box__title__name">FT Property Summit 2015</div></div>' +
						'<div class="related-box__headline"><a class="related-box__headline--link" data-trackable="link-headline" href="https://live.ft.com/Events/2015/FT-Property-Summit-2015">9th Annual Property Summit</a></div>' +
						'<div class="related-box__image"><a class="related-box__image--link" data-trackable="link-image" href="https://live.ft.com/Events/2015/FT-Property-Summit-2015"><div class="article-image__placeholder" style="padding-top:56.25%;">' +
						'<img alt="Housing market economic dashboard" src="https://next-geebee.ft.com/image/v1/images/raw/http://com.ft.imagepublish.prod.s3.amazonaws.com/aa4eec2e-1bfd-11e5-8201-cbdb03d71480?source=next&amp;fit=scale-down&amp;width=300"></div></a></div>' +
						'<div class="related-box__content"><p>The Financial Times is delighted to present the 9th annual <strong>FT Property Summit</strong></p>' +
						'<p>This will bring together global investors, occupiers, lenders and developers to explore the opportunities available in the UK commercial property market</p></div>' +
					'<div><a href="https://live.ft.com/Events/2015/FT-Property-Summit-2015" class="related-box__link" data-trackable="link-read-more">Read more</a></div></div>' +
				'</aside>\n'
			);
		});
	});

	it('should remove add the appropriate mark up for a related box that is an article with existing mark up', () => {
		return transform(
			'<ft-related type="http://www.ft.com/ontology/content/Article" url="http://api.ft.com/content/e539eab8-8c83-11e5-8be4-3506bf20cc2b">' +
				'<media><img src="http://com.ft.imagepublish.prod.s3.amazonaws.com/aa4eec2e-1bfd-11e5-8201-cbdb03d71480" alt="Housing market economic dashboard" longdesc="" width="2048" height="1152" /></media>' +
				'<headline>9th Annual Property Summit</headline>' +
				'<intro><p>The Financial Times is delighted to present the 9th annual <strong>FT Property Summit</strong></p>' +
				'<p>This will bring together global investors, occupiers, lenders and developers to explore the opportunities available in the UK commercial property market</p></intro>' +
			'</ft-related>'
		)
		.then(transformedXml => {
			transformedXml.should.equal(
				'<aside data-trackable="related-box" role="complementary" class="related-box ng-inline-element related-box__article to-fetch" uuid="e539eab8-8c83-11e5-8be4-3506bf20cc2b">' +
					'<div class="related-box__wrapper">' +
						'<div class="related-box__headline"><a class="related-box__headline--link" data-trackable="link-headline" href="/content/e539eab8-8c83-11e5-8be4-3506bf20cc2b">9th Annual Property Summit</a></div>' +
						'<div class="related-box__image"><a class="related-box__image--link" data-trackable="link-image" href="/content/e539eab8-8c83-11e5-8be4-3506bf20cc2b"><div class="article-image__placeholder" style="padding-top:56.25%;">' +
						'<img alt="Housing market economic dashboard" src="https://next-geebee.ft.com/image/v1/images/raw/http://com.ft.imagepublish.prod.s3.amazonaws.com/aa4eec2e-1bfd-11e5-8201-cbdb03d71480?source=next&amp;fit=scale-down&amp;width=300"></div></a></div>' +
						'<div class="related-box__content"><p>The Financial Times is delighted to present the 9th annual <strong>FT Property Summit</strong></p>' +
						'<p>This will bring together global investors, occupiers, lenders and developers to explore the opportunities available in the UK commercial property market</p></div>' +
					'<div><a href="/content/e539eab8-8c83-11e5-8be4-3506bf20cc2b" class="related-box__link" data-trackable="link-read-more">Read more</a></div></div>' +
				'</aside>\n'
			);
		});
	});

});
