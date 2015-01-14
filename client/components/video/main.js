'use strict';
var flags = require('next-feature-flags-client');
var brightcove = require('./brightcove');

var video = {
	'video.ft.com': [],
	'youtube.com': [],
	'player.vimeo.com': []
};

var videoTags = [].slice.call(document.querySelectorAll('a'));

Object.keys(video).forEach(function(key){
	videoTags.forEach(function(el){
		el.getAttribute('href').indexOf(key) > -1 && video[key].push(el);				
	});
	video[key].forEach(function(el){
		embedVideo(key, el);
	});	
});
	
function brightcoveInit (el) {
	var url = el.getAttribute('href');
	var videoId = url.slice((url.lastIndexOf('/')+1));
	
	brightcove(videoId).then(function(url){
		var videoEl = document.createElement('video');
		videoEl.setAttribute('src', url);
		videoEl.setAttribute('controls', 'true');
		el.parentNode.replaceChild(videoEl, el);
	}).catch(function(e){
		el.parentNode.removeChild(el);	
		setTimeout(function() { throw e; });
	});	
}

function youtubeInit (el) { 
	var attrs = [
		['src', el.getAttribute('href')],
		['width', '560'],
		['height', '315'],
	];
	el.parentNode.replaceChild(makeIframe(attrs), el);
}

function vimeoInit (el) { 
	var attrs = [
		['src', el.getAttribute('href')],
		['width', '500'],
		['height', '281'],
	];
  	el.parentNode.replaceChild(makeIframe(attrs), el);
}

function makeIframe(attrs) {
	var iframe = document.createElement('iframe');
	attrs = attrs.concat([
		['frameborder', '0'],
		['webkitallowfullscreen', 'true'],
		['mozallowfullscreen', 'true'],
		['allowfullscreen', 'true']
	]);
	attrs.forEach(function(attr){
		iframe.setAttribute(attr[0], attr[1]);
	});
	return iframe;
}

function embedVideo (type, el) {
	switch (type) {
		case 'video.ft.com':
			brightcoveInit(el);
		break;
		case 'youtube.com':
			youtubeInit(el);
		break;
		case 'player.vimeo.com':
			vimeoInit(el);
		break;
	}
}



