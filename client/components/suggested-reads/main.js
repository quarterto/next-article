'use strict';
var fetchres = require('fetchres');

module.exports = {
	init: function() {
		return;
		// if (!flags.get('articleSuggestedRead')) { return; }
		var el = document.querySelector('.js-suggested-reads');
		var data = document.getElementById('dehydrated-data');

		try {
			data = JSON.parse(data.text);
		} catch(err) {
			return;
		}
		var ids = `ids=${encodeURI(JSON.stringify(data.suggestedReads.ids))}`;

		fetch(`/articles?${ids}`, {
			method: 'GET',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/text'
			}
		})
		.then(fetchres.text)
		.then(html => {
			el.innerHTML = html;
		})
		.catch(console.error);
	}
};
