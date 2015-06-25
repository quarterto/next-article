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

module.exports = function bigReadTransform(article) {
	var parseFile = denodeify(libxslt.parseFile);

	// If you pass in an XML document you get an XML document
	var articleXML = libxslt.libxmljs.parseXml(wrap(article));

	return parseFile(__dirname + '/../stylesheets/article.xsl').then(function(stylesheet) {
		var transformedXML = stylesheet.apply(articleXML);

		//  We only want the (HTML) context, not the XML document as a whole
		return unwrap(transformedXML.get('.').toString());
	});
};
