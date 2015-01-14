'use strict';
var flags = require('next-feature-flags-client');
var brightcove = require('./brightcove');

var video = {
	'video.ft.com': [],
	'youtube.com': []
};

var videoTags = [].slice.call(document.querySelectorAll('a'));

(function initVideos () {
	Object.keys(video).forEach(function(key){
		videoTags.forEach(function(el){
			el.getAttribute('href').indexOf(key) > -1 && video[key].push(el);				
		});
		video[key].forEach(function(el){
			embedVideo(key, el);
		});	
	});
	
})();	

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
	console.log('youtube vid');
}

function embedVideo (type, el) {
	switch (type) {
		case 'video.ft.com':
			brightcoveInit(el);
		break;
		case 'youtube.com':
			youtubeInit();
		break;
	}
}



