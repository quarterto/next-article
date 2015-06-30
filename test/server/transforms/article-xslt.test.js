/*global describe, it, before*/
'use strict';

var fs = require('fs');
var expect = require('chai').expect;
var articleXSLT = require('../../../server/transforms/article-xslt');

describe('Article XSLT', function () {
	var article;

	before(function(callback) {
		fs.readFile(__dirname + '/../../fixtures/article.xml', function(err, articleXML) {
			articleXSLT(articleXML.toString(), { stylesheet: 'article', wrap: true }).then(function(transformedXML) {
				article = transformedXML;
				callback();
			});
		});
	});

	it('is unwrapped', function() {
		expect(article).to.not.match(/<\/?root>/g);
	});

});
