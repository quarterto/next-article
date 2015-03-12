// TODO: Combine with the equivalent in ft-next-express
'use strict';

module.exports = function(options) {
	return '//image.webservices.ft.com/v1/images/raw/' + encodeURIComponent(options.url) + '?width=' + options.width + '&source=next&fit=scale-down';
};
