'use strict';

var articleXSLT = require('../../../server/transforms/article-xslt');

module.exports = function(xml, params) {
	var defaults = {
		renderInteractiveGraphics: 0,
		useBrightcovePlayer: 0,
		renderTOC: 0,
		fullWidthMainImages: 0
	};

	var xsltParams = {};

	Object.keys(defaults).forEach(function(paramName) {
		xsltParams[paramName] = params && params[paramName] ?
			params[paramName] : defaults[paramName];
	});

	return articleXSLT(xml, 'main', xsltParams);
};
