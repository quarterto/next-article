'use strict';
module.exports = function(body) {
	return body.replace(/<p>\s*(?:<strong>)?[-*]{3,}(?:<\/strong>)?\s*<\/p>/, '<hr />');
};
