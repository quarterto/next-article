'use strict';

var denodeify = require('denodeify');
var libxslt = require('bbc-xslt');

// HACK: Body transforms have already unwrapped the document at this point.
function wrap(article) {
	return '<root>' + article + '</root>';
}

function unwrap(article) {
	return article.replace(/<\/?root>/g, '');
}

module.exports = function bigReadTransform(article, opts) {
	var stylesheet = (opts && opts.stylesheet) || 'main';
	var parseFile = denodeify(libxslt.parseFile);

	// If you pass in an XML document you get an XML document
	var articleXML = libxslt.libxmljs.parseXml(opts && opts.wrap ? wrap(article) : article);

	return parseFile(__dirname + '/../stylesheets/' + stylesheet + '.xsl').then(function(stylesheet) {
		var transformedXML = stylesheet.apply(articleXML);

		//  We only want the (HTML) context, not the XML document as a whole
		var xml = transformedXML.get('.').toString();
		return opts && opts.wrap ? unwrap(xml) : xml;
	});
};
