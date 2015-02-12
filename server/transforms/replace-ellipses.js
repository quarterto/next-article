'use strict';
module.exports = function(body) {
	return body.replace(/ \. \. \. /g, '&thinsp;&hellip;&thinsp;')
		.replace(/\. \. \./g, '&hellip;');
};
