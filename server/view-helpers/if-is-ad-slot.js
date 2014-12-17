"use strict";
module.exports = function(index, options) {
	var input = parseInt(index, 10);
	if (input === 3 || input % 5 === 3) {
		return options.fn(this);
	}
};
