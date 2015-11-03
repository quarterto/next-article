/* global describe, it */

'use strict';

const transform = require('./transform-helper');
const expect = require('chai').expect;

describe('Tables', () => {

	it('translates tables with a single column into a promobox', () => {
		return transform(
				'<html>' +
					'<body>' +
						'<table class="data-table">' +
							'<caption>Lorem ipsum doler sit amet</caption>' +
							'<tr>' +
								'<td><p>Ut enim ad minim veniam</p></td>' +
							'</tr>' +
						'</table>' +
					'</body>' +
				'</html>'
			)
			.then((transformedXml) => {
				expect(transformedXml).to.equal(
					'<body>' +
						'<aside class="promo-box promo-box--long">' +
							'<div class="promo-box__wrapper">' +
								'<h3 class="promo-box__headline">Lorem ipsum doler sit amet</h3>' +
								'<div class="promo-box__content">' +
									'<p>Ut enim ad minim veniam</p>' +
								'</div>' +
							'</div>' +
						'</aside>' +
					'</body>\n'
				);
			});
	});

	it('leaves tables with multiple rows or columns alone', () => {
		return transform(
				'<html>' +
					'<body>' +
						'<table class="data-table">' +
							'<caption>Lorem ipsum doler sit amet</caption>' +
							'<tr>' +
								'<td><p>Ut enim ad minim veniam</p></td>' +
							'</tr>' +
							'<tr>' +
								'<td><p>Ut enim ad minim veniam</p></td>' +
							'</tr>' +
						'</table>' +
						'<table class="data-table">' +
							'<caption>Lorem ipsum doler sit amet</caption>' +
							'<tr>' +
								'<td><p>Ut enim ad minim veniam</p></td>' +
								'<td><p>Ut enim ad minim veniam</p></td>' +
							'</tr>' +
						'</table>' +
					'</body>' +
				'</html>'
			)
			.then((transformedXml) => {
				expect(transformedXml).to.equal(
					'<body>' +
						'<table class="data-table">' +
							'<caption>Lorem ipsum doler sit amet</caption>' +
							'<tr>' +
								'<td><p>Ut enim ad minim veniam</p></td>' +
							'</tr>' +
							'<tr>' +
								'<td><p>Ut enim ad minim veniam</p></td>' +
							'</tr>' +
						'</table>' +
						'<table class="data-table">' +
							'<caption>Lorem ipsum doler sit amet</caption>' +
							'<tr>' +
								'<td><p>Ut enim ad minim veniam</p></td>' +
								'<td><p>Ut enim ad minim veniam</p></td>' +
							'</tr>' +
						'</table>' +
					'</body>\n'
				);
			});
	});

});
