'use strict';
var traditional = require('./traditional');
var sidenotes = require('./sidenotes');

function getMetaValue(name) {
	var tag = document.querySelector(`meta[name="${name}"]`);
	return tag.content || '';
}

function init(uuid, flags) {
	var sidenotesActive = flags.get('livefyreSideNotes');
	var articleIsCommentOrAnalysis = (function(){
			var classification = getMetaValue('classification');
			return /(comment|analysis)/i.test(classification);
		}());

	if (sidenotesActive && articleIsCommentOrAnalysis) {
	       sidenotes.init(uuid, flags);
	} else {
		traditional.init(uuid, flags);
	}
}

module.exports = {
	init : init
};
