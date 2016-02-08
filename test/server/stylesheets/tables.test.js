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
								'<td><p>Ut enim ad minim veniam</p><br>I am a text node!</td>' +
							'</tr>' +
						'</table>' +
					'</body>' +
				'</html>'
			)
			.then((transformedXml) => {
				expect(transformedXml).to.equal(
					'<aside class="promo-box n-content-box n-content-u-border--all n-content-u-padding--left-right">' +
						'<h3 class="promo-box__headline">Lorem ipsum doler sit amet</h3>' +
						'<div class="promo-box__content">' +
							'<p>Ut enim ad minim veniam</p>' +
							'<br>I am a text node!' +
						'</div>' +
					'</aside>\n'
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
					'</table>\n'
				);
			});
	});

});
