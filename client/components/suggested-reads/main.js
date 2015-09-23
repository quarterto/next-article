'use strict';
var fetchres = require('fetchres');

module.exports = {
	init: function(flags) {
		if (!flags.get('articleSuggestedRead')) { return; }
		var el = document.querySelector('.js-suggested-reads');
		var data = document.getElementById('dehydrated-data');

		try {
			data = JSON.parse(data.text);
		} catch(err) {
			return;
		}

		fetch('/articles', {
			method: 'POST',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/text'
			},
			body: JSON.stringify({
				ids: data.suggestedReads.ids
			})
		})
		.then(fetchres.text)
		.then(html => {
			el.innerHTML = html;
		})
		.catch(console.error);
	}
};
