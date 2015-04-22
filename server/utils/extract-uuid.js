'use strict';

module.exports = function (uri) {
	return uri.replace(/http:\/\/(?:api|www).ft.com\/[^\/]+\/(.*)/, '$1');
};
