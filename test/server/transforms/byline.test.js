/*global describe, it*/
'use strict';

require('chai').should();
const bylineTransform = require('../../../server/transforms/byline');

describe('Byline', () => {

	it('should wrap author in link',() => {
		const byline = 'George Parker';
		const authors = [ { id: "ABCD-efhsdf", name: "George Parker" } ];

		bylineTransform(byline, authors).should.equal('<a class="n-content-tag" href="/stream/authorsId/ABCD-efhsdf" data-trackable="author">George Parker</a>');
	});

	it('should wrap multiple authors in links',() => {
		const byline = 'George Parker and Chris Giles';
		const authors = [
			{ id: "ABCD-efhsdf", name: "George Parker" },
			{ id: "OBCD-efhsdf", name: "Chris Giles" }
		];

		bylineTransform(byline, authors).should.equal(
			'<a class="n-content-tag" href="/stream/authorsId/ABCD-efhsdf" data-trackable="author">George Parker</a>' +
			' and ' +
			'<a class="n-content-tag" href="/stream/authorsId/OBCD-efhsdf" data-trackable="author">Chris Giles</a>'
		);
	});

	it('should do anything if no authors data', () => {
		const byline = 'George Parker and Chris Giles';
		const authors = [];

		bylineTransform(byline, authors).should.equal('George Parker and Chris Giles');
	});

});
