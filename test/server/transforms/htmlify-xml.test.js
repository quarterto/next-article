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

	it('should handle tag names with hyphens', function() {
		var xml = '<ft-slideshow data-uuid="9d142288-beae-11e4-8036-00144feab7de" data-syncid="1"/>';
		expect(htmlifyXML(xml)).to.equal('<ft-slideshow data-uuid="9d142288-beae-11e4-8036-00144feab7de" data-syncid="1"></ft-slideshow>');
	});

});
