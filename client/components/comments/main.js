'use strict';
var fetchres = require('fetchres');
var beneath = require('./beneath');
var rhs = require('./rhs');

function init(uuid, flags){
	console.log('comments init');
	return fetch('/article/' + uuid + '/comments-hack', { credentials: 'same-origin' })
		.then(fetchres.json)
		.then(function(flagsOn) {
			//if (!flagsOn) {
			//	return;
			//}else{
				console.log('Comments enabled');
				return flags.get('geniusStyleComments') ? rhs.init(uuid, flags) : beneath.init(uuid, flags);
			//}
		}).catch(function(err){
			setTimeout(function(){
				throw err;
			}, 0);
		})
}

module.exports = {
	init : init
};
