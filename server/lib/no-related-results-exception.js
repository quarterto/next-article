"use strict";

function NoRelatedResultsException() {
	this.name = NoRelatedResultsException.NAME;
}

Object.defineProperty(NoRelatedResultsException, 'NAME', {
	writable:false,
	value:'NoRelatedResultsException'
});

module.exports = NoRelatedResultsException;
