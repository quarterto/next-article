/* global describe, it */
'use strict';

var denodeify = require('denodeify');
var articleXSLT = require('../../../server/transforms/article-xslt');
require('chai').should();

function transform(xml) {
	return articleXSLT(xml, 'main');
}

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
						'<div class="js-more-on-inline" data-trackable="more-on-inline"></div>' +
						'<p>4</p>' +
						'<p>5</p>' +
						'<p>6</p>' +
					'</body>\n'
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
					'</body>\n'
				);
			});
	});

});
