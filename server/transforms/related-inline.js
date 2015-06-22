'use strict';

module.exports = function ($) {

	// insert inline related
	if ($('body > p').length >= 6) {
		var paraHook = $('body > p').get(3);
		$(paraHook).after('<div class="js-more-on-inline" data-trackable="more-on-inline"></div>');
	}

	return $;

};
