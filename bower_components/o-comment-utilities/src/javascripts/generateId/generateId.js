"use strict";

var generateId = function () {
	var text = "";
	var possible = "abcdefghijklmnopqrstuvwxyz";
	var length = (Math.random() + 1) * 10;

	for( var i=0; i < length; i++ )
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
};

module.exports = generateId;
