'use strict';

module.exports = function(body) {
	return body.replace(/<p>\s*<strong>(.*?)<\/strong>\s*<\/p>/g, '<h3 class="ft-subhead">$1</h3>');
};
