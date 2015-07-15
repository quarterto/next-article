/* global describe, it */
'use strict';

var transform = require('./transform-helper');
require('chai').should();

describe('Related Inline', function () {

	it('should insert the related after the 3rd paragraph', function () {
		return transform(
				'<body>' +
					'<p>1</p>' +
					'<p>2</p>' +
					'<p>3</p>' +
					'<p>4</p>' +
					'<p>5</p>' +
					'<p>6</p>' +
				'</body>'
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<p>1</p>' +
						'<p>2</p>' +
						'<p>3</p>' +
						'<div class="js-more-on-inline" data-trackable="more-on-inline"/>' +
						'<p>4</p>' +
						'<p>5</p>' +
						'<p>6</p>' +
					'</body>'
				);
			});
	});

	it('should not insert a related inline if there are less than 6 paragraphs', function () {
		return transform(
				'<body>' +
					'<p>1</p>' +
					'<p>2</p>' +
					'<p>3</p>' +
					'<p>4</p>' +
					'<p>5</p>' +
				'</body>'
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<p>1</p>' +
						'<p>2</p>' +
						'<p>3</p>' +
						'<p>4</p>' +
						'<p>5</p>' +
					'</body>'
				);
			});
	});

});
