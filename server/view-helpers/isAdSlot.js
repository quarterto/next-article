"use strict";
module.exports = function(options) {
	var input = parseInt(options.fn(this), 10);
	return input === 3 || input % 5 === 3;
};
