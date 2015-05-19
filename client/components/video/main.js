'use strict';
var brightcove = require('./brightcove');

var video = [
	'video.ft.com',
	'youtube.com',
	'player.vimeo.com'
];

function brightcoveInit(el) {
	var url = el.getAttribute('href');

	return brightcove(url)
		.then(function (data) {
			var videoEl = document.createElement('video');
			videoEl.setAttribute('src', data.src);
			videoEl.setAttribute('data-content-id', data.id);
			videoEl.setAttribute(
				'poster',
				'https://next-geebee.ft.com/image/v1/images/raw/' + encodeURIComponent(data.poster) + '?width=710&source=article&fit=scale-down'
			);
			videoEl.setAttribute('controls', 'true');
			videoEl.className = 'article__video ng-media';
			el.parentNode.replaceChild(videoEl, el);
		}).catch(function(e){
			var parent = el.parentNode;

			if (parent.matches('.article__video-wrapper')) {
				parent.parentNode.removeChild(parent);
			} else {
				parent.removeChild(el);
			}

			if (e.message !== 'Video format not supported') {
				setTimeout(function() { throw e; });
			}
		});
}

function youtubeInit(el) {
	var youtubeEmbedUrl = el.getAttribute('href')
		.replace(/https?:\/\/(?:www\.)?youtube\.com\/watch\?v=(.*)/, "https://youtube.com/embed/$1");
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
			return brightcoveInit(el);
		case 'youtube.com':
			youtubeInit(el);
		break;
		case 'player.vimeo.com':
			vimeoInit(el);
		break;
	}
	return Promise.resolve(null);
}

module.exports.init = function () {
	var videoTags = [].slice.call(document.querySelectorAll('.article .article__video-wrapper a'));

	return Promise.all(videoTags.map(function(el) {
			var type = video.filter(function(key) {
				return el.getAttribute('href').indexOf(key) > -1;
			})[0];
			return embedVideo(type, el);
		}));
};
