'use strict';
var fetchres = require('fetchres');
var traditional = require('./traditional');
var sidenotes = require('./sidenotes');

function init(uuid, flags){
	// if we're showing a barrier we don't care about comments
	if(document.querySelector('[data-barrier]') !== null){
		return;
	}


	return fetch('/article/' + uuid + '/comments-hack', { credentials: 'same-origin' })
		.then(fetchres.json)
		.then(function(flagsOn) {
			if (!flagsOn) {
				return;
			}else{
				return flags.get('livefyreSideNotes') ? sidenotes.init(uuid, flags) : traditional.init(uuid, flags);
			}
		}).catch(function(err){
			setTimeout(function(){
				throw err;
			}, 0);
		});
}

module.exports = {
	init : init
};
