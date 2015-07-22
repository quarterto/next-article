/*global describe, it, before*/
'use strict';

var fs = require('fs');
var expect = require('chai').expect;
var articleXSLT = require('../../../server/transforms/article-xslt');

describe('Article XSLT', function () {
	var article;

	before(function(callback) {
		fs.readFile(process.cwd() + '/test/fixtures/article.xml', function(err, xml) {
			if (err) {
				throw err;
			}

			articleXSLT(xml.toString(), '../../test/fixtures/article').then(function(transformed) {
				article = transformed;
				callback();
			});
		});
	});

	it('is unwrapped', function() {
		expect(article).to.not.match(/<\/?html>/g);
	});

});
