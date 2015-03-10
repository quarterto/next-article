'use strict';

function brightcove(videoId) {

	if (!videoId.match(/^\d{13}$/)) {
		return Promise.reject(new Error('Invalid video id: ' + videoId));
	}

	return fetch('http://ft-next-brightcove-proxy-api.herokuapp.com/' + videoId)
		.then(function(response) {
			if (response.status === 404) {
				throw new Error('Video ' + videoId + ' not found or not available in compatible format');
			} else if (response.status >= 400) {
				throw new Error('Bad response from server for video ' + videoId);
			}
			return response.json();
		})
		.then(function (data) {
			return {
				src: data.renditions[0].url,
				poster: data.videoStillURL
			};
		});
}

module.exports = brightcove;
