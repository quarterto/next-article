'use strict';
var flags = require('next-feature-flags-client');
var Beacon = require('next-beacon-component');

require('next-wrapper');
require('next-user-preferences');
require('next-article-card-component');

flags.init().then(function(){
	var allFlags = flags.getAll();

	if (allFlags.contentApiCalls && allFlags.contentApiCalls.isSwitchedOn) {
		require('./components/more-on/main');
	}

	if (allFlags.beacon && allFlags.beacon.isSwitchedOn) {

		// fire a beacon after 5s of being on the page
		setTimeout(function() {
			Beacon.fire('click', {
				uuid: location.pathname.slice(1)
			});
		}, 5000);

	}
});
