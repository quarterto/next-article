'use strict';

var denodeify = require('denodeify');
var libxslt = require('bbc-xslt');

module.exports = function (xml, opts) {
	var defaultXsltVars = {
		renderSlideshows: 0,
		renderInteractiveGraphics: 0,
		useBrightcovePlayer: 0,
		renderTOC: 0
	};
	var xsltVars = {};
	Object.keys(defaultXsltVars).forEach(function (xsltVarName) {
		xsltVars[xsltVarName] = opts && opts.xsltVars && opts.xsltVars[xsltVarName] ?
			opts.xsltVars[xsltVarName] : defaultXsltVars[xsltVarName];
	});
	var parsedXml = libxslt.libxmljs.parseXml(xml);
	return denodeify(libxslt.parseFile)(__dirname + '/../../../server/stylesheets/main.xsl')
		.then(function (stylesheet) {
			return stylesheet.apply(parsedXml, xsltVars).get('.').toString();
		});
};
