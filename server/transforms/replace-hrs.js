'use strict';
module.exports = function(body) {
	return body.replace(/<p>\s*(?:<strong>)?(?:[-*]{3,}|&hellip;)(?:<\/strong>)?\s*<\/p>/, '<hr />');
};
