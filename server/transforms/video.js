'use strict';

var $ = require('cheerio');

module.exports = function (index, el) {
	var $el = $(el);
	var href = $el.attr('href');
	// key: name of source, value: regex to extract the video's id from the url
	var sources = {
		brightcove: /https?:\/\/video.ft.com\/(\d+)/,
		youtube: /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=(.*)/
	};
	var videoSource;
	var videoId;
	for (var source in sources) {
		if (sources.hasOwnProperty(source)) {
			var idMatch = href.match(sources[source]);
			if (idMatch) {
				videoSource = source;
				videoId = idMatch[1];
				break;
			}
		}
	}

	if (videoSource && videoId) {
		return $('<div></div>')
			.addClass('article__video-wrapper ng-media-wrapper')
			.attr('data-n-component', 'n-video')
			.attr('data-n-video-source', videoSource)
			.attr('data-n-video-id', videoId);
	} else {
		return '';
	}
};
