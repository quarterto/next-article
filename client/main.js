'use strict';
var flags = require('next-feature-flags-client');

require('isomorphic-fetch');
require('ft-next-wrapper');
require('next-header');
require('next-user-preferences');
require('next-article-card-component');

var emit = function(name, data) {
	var event = document.createEvent('Event');
	event.initEvent(name, true, true);
	if (data) {
		event.detail = data;
	}
	document.dispatchEvent(event);
};

function clearNotification() {
	var uuid = document.querySelector('[data-capi-id]').getAttribute('data-capi-id');
	emit('notifications:remove', { uuid: 'Article:' + uuid });
}

clearNotification();

flags.init().then(function(){
	var allFlags = flags.getAll();

	if (allFlags.contentApiCalls && allFlags.contentApiCalls.isSwitchedOn) {
		require('./components/more-on/main');
	}

	if (allFlags.beacon && allFlags.beacon.isSwitchedOn) {
		require('next-beacon-component');
	}

});
