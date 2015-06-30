/*global describe, it*/
'use strict';

require('chai').should();
var bylineTransform = require('../../../server/transforms/byline');

describe('Byline', function () {

	it('should wrap author in link', function() {
		var byline = 'George Parker';
		var article = {
			item: {
				metadata: {
					authors: [{
						term: { id: "ABCD-efhsdf", name: "George Parker" }
					}]
				}
			}
		};

		bylineTransform(byline, article).should.equal('<a class="article__author" href="/stream/authorsId/ABCD-efhsdf" data-trackable="author">George Parker</a>');
	});

	it('should wrap multiple authors in links', function() {
		var byline = 'George Parker and Chris Giles';
		var article = {
			item: {
				metadata: {
					authors: [
						{
							term: { id: "ABCD-efhsdf", name: "George Parker" }
						},
						{
							term: { id: "OBCD-efhsdf", name: "Chris Giles" }
						}
					]
				}
			}
		};

		bylineTransform(byline, article).should.equal(
			'<a class="article__author" href="/stream/authorsId/ABCD-efhsdf" data-trackable="author">George Parker</a>' +
			' and ' +
			'<a class="article__author" href="/stream/authorsId/OBCD-efhsdf" data-trackable="author">Chris Giles</a>'
		);
	});

	it('should do anything if no authors data', function() {
		var byline = 'George Parker and Chris Giles';
		var article = {
			item: {
				metadata: {
					authors: []
				}
			}
		};

		bylineTransform(byline, article).should.equal('George Parker and Chris Giles');
	});

});
