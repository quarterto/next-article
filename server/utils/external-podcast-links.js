'use strict';

var podcastMapping = require('n-podcast-mapping');

function source(url) {
	if (url.includes('apple.com')) {
		return 'itunes';
	}
	if (url.includes('stitcher.com')) {
		return 'stitcher';
	}
	if (url.includes('audioboom.com')) {
		return 'audioboom';
	}
	if (url.includes('soundcloud.com')) {
		return 'soundcloud';
	}
	if (url.includes('overcast.fm')) {
		return 'overcast';
	}
}

module.exports = function externalPodcastLinks(showUrl) {
	var showSlug = showUrl.replace('http://rss.acast.com/', '');
	var links = podcastMapping.linksFor(showSlug);

	return links.reduce(function(map, value) {
		var key = source(value);
		key && (map[key] = value);
		return map;
	}, {});

	return data && apply(data);
};
