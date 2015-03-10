'use strict';
module.exports = function(body) {
	console.log(body);
	return body.replace(/<p>\s*(?:<strong>)?(?:[-*]{3,}|&hellip;)(?:<\/strong>)?\s*<\/p>/m, '<hr />');
};
