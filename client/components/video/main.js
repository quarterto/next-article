'use strict';
var brightcove = require('./brightcove');

var video = [
	'video.ft.com',
	'youtube.com',
	'player.vimeo.com'
];

var videoTags = [].slice.call(document.querySelectorAll('a'));

videoTags.filter(function(el) {
		return el.innerText === '';
	})
	.forEach(function(el) {
		video.forEach(function(key) {
			if (el.getAttribute('href').indexOf(key) > -1) {
				embedVideo(key, el);
			}
		});
	});

function brightcoveInit(el) {
	var url = el.getAttribute('href');
	var videoId = url.slice((url.lastIndexOf('/')+1));

	brightcove(videoId).then(function(data) {
		var videoEl = document.createElement('video');
		videoEl.setAttribute('src', data.src);
		videoEl.setAttribute(
			'poster',
			'//image.webservices.ft.com/v1/images/raw/' + encodeURIComponent(data.poster) + '?width=690&source=grumman&fit=scale-down'
		);
		videoEl.setAttribute('controls', 'true');
		el.parentNode.replaceChild(videoEl, el);
	}).catch(function(e){
		el.parentNode.removeChild(el);
		setTimeout(function() { throw e; });
	});
}

function youtubeInit(el) {
	var youtubeEmbedUrl = el.getAttribute('href')
		.replace(/https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([A-Za-z0-9])/, "https://youtube.com/embed/$1");
	var attrs = [
		['src', youtubeEmbedUrl],
		['width', '560'],
		['height', '315'],
	];
	el.parentNode.replaceChild(makeIframe(attrs), el);
}

function vimeoInit(el) {
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
