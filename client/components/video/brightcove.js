'use strict';

function brightcove(url) {
	var videoIdMatch = url.match(/http:\/\/video.ft.com\/(\d{13})/);
	if (!videoIdMatch) {
		return Promise.reject(new Error('Unable to parse video id from url "' + url + '"'));
	}
	var videoId = videoIdMatch[1];

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
				id: videoId,
				src: data.renditions[0].url,
				poster: data.videoStillURL
			};
		});
}

module.exports = brightcove;
