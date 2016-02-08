/* global describe, it */
'use strict';

const transform = require('./transform-helper');
require('chai').should();

describe('Related Box', () => {

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
				'<aside class="n-content-box n-content-box--inline u-border--all" data-trackable="related-box" role="complementary">' +
					'<div class="aside--headline u-margin--left-right"><a data-trackable="link-headline" href="https://live.ft.com/Events/2015/FT-Property-Summit-2015">9th Annual Property Summit</a></div>' +
					'<div class="aside--image"><a data-trackable="link-image" href="https://live.ft.com/Events/2015/FT-Property-Summit-2015"><div class="n-content-image__placeholder" style="padding-top:56.25%;">' +
					'<img alt="Housing market economic dashboard" src="https://next-geebee.ft.com/image/v1/images/raw/http://com.ft.imagepublish.prod.s3.amazonaws.com/aa4eec2e-1bfd-11e5-8201-cbdb03d71480?source=next&amp;fit=scale-down&amp;width=470"></div></a></div>' +
					'<div class="aside--content u-margin--left-right"><p>The Financial Times is delighted to present the 9th annual <strong>FT Property Summit</strong></p>' +
					'<p>This will bring together global investors, occupiers, lenders and developers to explore the opportunities available in the UK commercial property market</p></div>' +
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
				'<aside class="n-content-box n-content-box--inline u-border--all" data-trackable="related-box" role="complementary">' +
					'<div class="aside--headline u-margin--left-right">9th Annual Property Summit</div>' +
					'<div class="aside--image"><div class="n-content-image__placeholder" style="padding-top:56.25%;">' +
					'<img alt="Housing market economic dashboard" src="https://next-geebee.ft.com/image/v1/images/raw/http://com.ft.imagepublish.prod.s3.amazonaws.com/aa4eec2e-1bfd-11e5-8201-cbdb03d71480?source=next&amp;fit=scale-down&amp;width=470"></div></div>' +
					'<div class="aside--content u-margin--left-right"><p>The Financial Times is delighted to present the 9th annual <strong>FT Property Summit</strong></p>' +
					'<p>This will bring together global investors, occupiers, lenders and developers to explore the opportunities available in the UK commercial property market</p></div>' +
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
				'<aside class="n-content-box n-content-box--inline u-border--all" data-trackable="related-box" role="complementary">' +
					'<div class="n-content-box__title"><div class="n-content-box__title-text u-background-color--pink">FT Property Summit 2015</div></div>' +
					'<div class="aside--headline u-margin--left-right"><a data-trackable="link-headline" href="https://live.ft.com/Events/2015/FT-Property-Summit-2015">9th Annual Property Summit</a></div>' +
					'<div class="aside--image"><a data-trackable="link-image" href="https://live.ft.com/Events/2015/FT-Property-Summit-2015"><div class="n-content-image__placeholder" style="padding-top:56.25%;">' +
					'<img alt="Housing market economic dashboard" src="https://next-geebee.ft.com/image/v1/images/raw/http://com.ft.imagepublish.prod.s3.amazonaws.com/aa4eec2e-1bfd-11e5-8201-cbdb03d71480?source=next&amp;fit=scale-down&amp;width=470"></div></a></div>' +
					'<div class="aside--content u-margin--left-right"><p>The Financial Times is delighted to present the 9th annual <strong>FT Property Summit</strong></p>' +
					'<p>This will bring together global investors, occupiers, lenders and developers to explore the opportunities available in the UK commercial property market</p></div>' +
				'</aside>\n'
			);
		});
	});

	it('should put in the appropriate mark up for a related box that is not an article with existing mark up - with title - small image', () => {
		return transform(
			'<ft-related url="https://live.ft.com/Events/2015/FT-Property-Summit-2015">' +
				'<media><img src="http://com.ft.imagepublish.prod.s3.amazonaws.com/aa4eec2e-1bfd-11e5-8201-cbdb03d71480" alt="Housing market economic dashboard" longdesc="" width="167" height="96" /></media>' +
				'<title>FT Property Summit 2015</title>' +
				'<headline>9th Annual Property Summit</headline>' +
				'<intro><p>The Financial Times is delighted to present the 9th annual <strong>FT Property Summit</strong></p>' +
				'<p>This will bring together global investors, occupiers, lenders and developers to explore the opportunities available in the UK commercial property market</p></intro>' +
			'</ft-related>'
		)
		.then(transformedXml => {
			transformedXml.should.equal(
				'<aside class="n-content-box n-content-box--inline u-border--all" data-trackable="related-box" role="complementary">' +
					'<div class="n-content-box__title"><div class="n-content-box__title-text u-background-color--pink">FT Property Summit 2015</div></div>' +
					'<div class="aside--headline u-margin--left-right"><a data-trackable="link-headline" href="https://live.ft.com/Events/2015/FT-Property-Summit-2015">9th Annual Property Summit</a></div>' +
					'<div class="aside--image u-margin--left-right"><a data-trackable="link-image" href="https://live.ft.com/Events/2015/FT-Property-Summit-2015"><div class="n-content-image__placeholder" style="padding-top:96px;">' +
					'<img alt="Housing market economic dashboard" src="https://next-geebee.ft.com/image/v1/images/raw/http://com.ft.imagepublish.prod.s3.amazonaws.com/aa4eec2e-1bfd-11e5-8201-cbdb03d71480?source=next&amp;fit=scale-down&amp;width=167"></div></a></div>' +
					'<div class="aside--content u-margin--left-right"><p>The Financial Times is delighted to present the 9th annual <strong>FT Property Summit</strong></p>' +
					'<p>This will bring together global investors, occupiers, lenders and developers to explore the opportunities available in the UK commercial property market</p></div>' +
				'</aside>\n'
			);
		});
	});

	it('should add the appropriate mark up for a related box that is an article with without a title', () => {
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
				'<aside class="n-content-box n-content-box--inline u-border--all" data-trackable="related-box" role="complementary">' +
						'<div class="n-content-box__title"><div class="n-content-box__title-text u-background-color--pink">Related article</div></div>' +
						'<div class="aside--image"><a data-trackable="link-image" href="/content/e539eab8-8c83-11e5-8be4-3506bf20cc2b"><div class="n-content-image__placeholder" style="padding-top:56.25%;">' +
						'<img alt="Housing market economic dashboard" src="https://next-geebee.ft.com/image/v1/images/raw/http://com.ft.imagepublish.prod.s3.amazonaws.com/aa4eec2e-1bfd-11e5-8201-cbdb03d71480?source=next&amp;fit=scale-down&amp;width=470"></div></a></div>' +
						'<div class="aside--headline u-margin--left-right"><a data-trackable="link-headline" href="/content/e539eab8-8c83-11e5-8be4-3506bf20cc2b">9th Annual Property Summit</a></div>' +
						'<div class="aside--content u-margin--left-right"><p>The Financial Times is delighted to present the 9th annual <strong>FT Property Summit</strong></p>' +
						'<p>This will bring together global investors, occupiers, lenders and developers to explore the opportunities available in the UK commercial property market</p></div>' +
				'</aside>\n'
			);
		});
	});

	it('should add the appropriate mark up for a related box that is an article with with a title', () => {
		return transform(
			'<ft-related type="http://www.ft.com/ontology/content/Article" url="http://api.ft.com/content/e539eab8-8c83-11e5-8be4-3506bf20cc2b">' +
				'<title>Bridge the generation gap</title>' +
				'<headline>9th Annual Property Summit</headline>' +
				'<media><img src="http://com.ft.imagepublish.prod.s3.amazonaws.com/aa4eec2e-1bfd-11e5-8201-cbdb03d71480" alt="Housing market economic dashboard" longdesc="" width="2048" height="1152" /></media>' +
				'<intro><p>The Financial Times is delighted to present the 9th annual <strong>FT Property Summit</strong></p>' +
				'<p>This will bring together global investors, occupiers, lenders and developers to explore the opportunities available in the UK commercial property market</p></intro>' +
			'</ft-related>'
		)
		.then(transformedXml => {
			transformedXml.should.equal(
				'<aside class="n-content-box n-content-box--inline u-border--all" data-trackable="related-box" role="complementary">' +
					'<div class="n-content-box__title"><div class="n-content-box__title-text u-background-color--pink">Bridge the generation gap</div></div>' +
					'<div class="aside--image"><a data-trackable="link-image" href="/content/e539eab8-8c83-11e5-8be4-3506bf20cc2b"><div class="n-content-image__placeholder" style="padding-top:56.25%;">' +
					'<img alt="Housing market economic dashboard" src="https://next-geebee.ft.com/image/v1/images/raw/http://com.ft.imagepublish.prod.s3.amazonaws.com/aa4eec2e-1bfd-11e5-8201-cbdb03d71480?source=next&amp;fit=scale-down&amp;width=470"></div></a></div>' +
					'<div class="aside--headline u-margin--left-right"><a data-trackable="link-headline" href="/content/e539eab8-8c83-11e5-8be4-3506bf20cc2b">9th Annual Property Summit</a></div>' +
					'<div class="aside--content u-margin--left-right"><p>The Financial Times is delighted to present the 9th annual <strong>FT Property Summit</strong></p>' +
					'<p>This will bring together global investors, occupiers, lenders and developers to explore the opportunities available in the UK commercial property market</p></div>' +
				'</aside>\n'
			);
		});
	});


});
