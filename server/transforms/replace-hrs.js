'use strict';
module.exports = function(body) {
	return body.replace(/<p>[-*]{3,}<\/p>/, '<hr />');
};
