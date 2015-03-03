'use strict';

module.exports = function(body) {
	return body.replace(/<p>\s*<strong>(.*)<\/strong>\s*<\/p>/, '<h3>$1</h3>');
};
