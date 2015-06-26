/*global describe, it, before*/
'use strict';

var fs = require('fs');
var expect = require('chai').expect;
var htmlifyXML = require('../../../server/transforms/htmlify-xml');

describe('HTML-ify XML', function () {
	var article;

	before(function(callback) {
		fs.readFile(__dirname + '/../../fixtures/article.xml', function(err, articleXML) {
			article = htmlifyXML(articleXML.toString());
			callback();
		});
	});

	it('remove the XML declaration', function() {
		expect(article).to.not.contain('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>');
	});

	it('fixes tags that have been self-closed but shouldn\'t be', function() {
		expect(article).to.not.match(/<(?!br|hr|img)[^>]+?\/>/);
	});

});
