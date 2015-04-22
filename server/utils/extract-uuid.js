'use strict';

module.exports = function (uri) {
	return uri.replace(/http:\/\/[^.]+.ft.com\/[^\/]+\/(.*)/, '$1');
};
