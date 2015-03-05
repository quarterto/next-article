'use strict';

module.exports.init = function (flags) {
	if (flags.get('articleTOC').isSwitchedOff) {
		return false;
	}

	var toc = document.querySelector('.article__toc__items');

	toc.addEventListener('change', function (event) {
		// get the section and update #
		window.location.hash = event.target.value;
	});
};
