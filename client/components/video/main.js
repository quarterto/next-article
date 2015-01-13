'use strict';
var flags = require('next-feature-flags-client');

flags.init().then(function(){
	var videos = ['video.ft.com', 'youtube.com']
	;

	[].slice.call(document.querySelectorAll('a')).forEach(function(el) {
		 el.innerHTML.trim() === '' && checkVideo(el);
	});

	function checkVideo (el) {
		videos.forEach(function(video){
			el.getAttribute('href').indexOf(video) > -1 && embedVideo(video, el);
		});
	}

	function embedVideo (type, el) {
		switch (type) {
			case 'video.ft.com':
				//Ideally we use client-side templating here
				var videoEl = document.createElement('video');
					videoEl.setAttribute('controls', 'true');
					videoEl.setAttribute('src', el.getAttribute('href'));
				el.parentNode.replaceChild(videoEl, el);	
				break;
			case 'youtube.com':
				var videoEl = document.createElement('iframe');
					videoEl.setAttribute('width', '560');
					videoEl.setAttribute('height', '315');
					videoEl.setAttribute('frameborder', '315');
					videoEl.setAttribute('allowfullscreen', 'true');
					//href needs to look like: //www.youtube.com/embed/D8axiZqKkcw otherwise CORS error
					videoEl.setAttribute('src', el.getAttribute('href'));
					el.parentNode.replaceChild(videoEl, el);	
				break;
		}
	}
});
