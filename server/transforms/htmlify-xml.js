'use strict';

var DOCTYPE = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
var SELF_CLOSED_TAGS = /<[^>]+?\/>/g;
var TAG_NAME = /^<(\w+)/;

function removeDoctype(article) {
	return article.replace(DOCTYPE, '');
}

function fixSelfClosingTags(article) {
	return article.replace(SELF_CLOSED_TAGS, function(match) {
		var tagName = TAG_NAME.exec(match)[1];

		// The regex could ignore these but creates 100x more steps
		if (['br', 'hr', 'img', 'input'].indexOf(tagName) > -1) {
			return match;
		}

		return match.replace('/>', '></' + tagName + '>');
	});
}

module.exports = function htmlify(articleXML) {
	return fixSelfClosingTags(removeDoctype(articleXML));
};
