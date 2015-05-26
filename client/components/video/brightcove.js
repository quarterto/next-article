'use strict';

var testEl = document.createElement( "video" );
var supportedFormats = {};
if ( testEl.canPlayType ) {
    // Check for MPEG-4 support
    supportedFormats.MPEG4 = "" !== testEl.canPlayType( 'video/mp4; codecs="mp4v.20.8"' );

    // Check for h264 support
    supportedFormats.H264 = "" !== ( testEl.canPlayType( 'video/mp4; codecs="avc1.42E01E"' )
        || testEl.canPlayType( 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"' ) );

    // Check for Ogg support
    supportedFormats.OGG = "" !== testEl.canPlayType( 'video/ogg; codecs="theora"' );

    // Check for Webm support
    supportedFormats.WEBM = "" !== testEl.canPlayType( 'video/webm; codecs="vp8, vorbis"' );
}

// get the rendition closest to the supplied width
function getAppropriateRendition(renditions, width) {
	var appropriateRendition;
	renditions
		.filter(function (rendition, index) {
			return supportedFormats[rendition.videoCodec];
		})
		.sort(function (renditionOne, renditionTwo) {
			return renditionTwo.frameWidth - renditionOne.frameWidth;
		})
		.some(function (rendition, index) {
			if (rendition.frameWidth < width) {
				appropriateRendition = (index === 0) ? rendition : renditions[index - 1];
				return true;
			}
			return false;
		});
	return appropriateRendition || renditions.pop();
}
function brightcove(url) {
	var videoIdMatch = url.match(/http:\/\/video.ft.com\/(\d+)/);
	if (!videoIdMatch) {
		return Promise.reject(new Error('Unable to parse video id from url "' + url + '"'));
	}
	var videoId = videoIdMatch[1];

	return fetch('//next-brightcove-proxy.ft.com/' + videoId)
		.then(function(response) {
			if (response.status === 404) {
				throw new Error('Video ' + videoId + ' not found or not available in compatible format');
			} else if (response.status >= 400) {
				throw new Error('Bad response from server for video ' + videoId);
			}
			return response.json();
		})
		.then(function (data) {
			var rendition = getAppropriateRendition(data.renditions, 710);
			if (!rendition) {
				throw new Error('Video format not supported');
			}
			return {
				id: videoId,
				src: rendition.url,
				poster: data.videoStillURL
			};
		});
}

module.exports = brightcove;
