/* global describe, it */
'use strict';

const transform = require('./transform-helper');
require('chai').should();

describe('Pull Quotes', function () {

	it('should turn capi v2 pull-quotes into quotes', () => {
		return transform(
				'<body>' +
					'<pull-quote>' +
						'<pull-quote-text>Think left and think right and think low and think high. Oh, the thinks you can think up if only you try!</pull-quote-text>' +
						'<pull-quote-source>Dr. Seuss</pull-quote-source>' +
					'</pull-quote>' +
				'</body>'
			)
			.then(transformedXml => {
				transformedXml.should.equal(
					'<blockquote class="article__quote article__quote--pull-quote aside--content c-box c-box--inline u-border--all">' +
						'<div class="pull-quote__quote-marks"></div>' +
						'<div class="u-padding--left-right">' +
							'<p>Think left and think right and think low and think high. Oh, the thinks you can think up if only you try!</p>' +
							'<footer class="article__quote-footer">Dr. Seuss</footer>' +
						'</div>' +
					'</blockquote>\n'
				);
			});
	});

	it('should not include citation if non available', () => {
		return transform(
				'<body>' +
					'<pull-quote>' +
						'<pull-quote-text>Think left and think right and think low and think high. Oh, the thinks you can think up if only you try!</pull-quote-text>' +
						'<pull-quote-source></pull-quote-source>' +
					'</pull-quote>' +
				'</body>'
			)
			.then(transformedXml => {
				transformedXml.should.equal(
					'<blockquote class="article__quote article__quote--pull-quote aside--content c-box c-box--inline u-border--all">' +
						'<div class="pull-quote__quote-marks"></div>' +
						'<div class="u-padding--left-right">' +
							'<p>Think left and think right and think low and think high. Oh, the thinks you can think up if only you try!</p>' +
						'</div>' +
					'</blockquote>\n'
				);
			});
	});

	it('should include an image if one was supplied', () => {
		return transform(
			'<body>' +
				'<pull-quote><pull-quote-text><p>Quote with master image</p></pull-quote-text>' +
					'<pull-quote-image><img src="http://com.ft.imagepublish.prod.s3.amazonaws.com/aa4eec2e-1bfd-11e5-8201-cbdb03d71480" alt="Housing market economic dashboard" longdesc="" width="2048" height="1152" /></pull-quote-image>' +
					'<pull-quote-source>Source with image</pull-quote-source>' +
				'</pull-quote>' +
			'</body>'
		)
		.then(transformedXml => {
			transformedXml.should.equal(
				'<blockquote class="article__quote article__quote--pull-quote aside--content c-box c-box--inline u-border--all u-padding--bottom-none">' +
					'<div class="pull-quote__quote-marks"></div>' +
					'<div class="u-padding--left-right u-padding--bottom">' +
						'<p>Quote with master image</p>' +
						'<footer class="article__quote-footer">Source with image</footer>' +
					'</div>' +
					'<div class="aside--image"><div class="article-image__placeholder" style="padding-top:56.25%;">' +
						'<img alt="Housing market economic dashboard" src="https://next-geebee.ft.com/image/v1/images/raw/http://com.ft.imagepublish.prod.s3.amazonaws.com/aa4eec2e-1bfd-11e5-8201-cbdb03d71480?source=next&amp;fit=scale-down&amp;width=470">' +
					'</div></div>' +
				'</blockquote>\n'
			);
		});
	});

});
