"use strict";

// Define each page you want to test, which elements you want to check on each page, and
// at which browser widths those elements should appear
// One process is started per page/width combination, so if you can pick a width that's already
// in play, it will save resources.

exports.testData = {
	"article_with_image": {
		"name": "article_with_image",
		"path": "ccf7af08-e904-11e4-a71a-00144feab7de",
		"elements": {
			"header_logo": {
				"name":"header_logo",
				"css":'.next-header__logo--ft',
				"widths":[
					500,
					1400
				]
			},
			"mypage_button": {
				"name":"myft_button",
				"css":'.next-header__primary-tools__mypage',
				"widths":[
					600,
					800,
					1000,
					1400
				]
			},
			"stand-first": {
				"name":"stand-first",
				"css":'.article__stand-first',
				"widths":[
					350,
					600,
					900,
					1000,
					1400
				]
			},
			"metadata": {
				"name":"metadata",
				"css":'.article__meta',
				"widths":[
					350,
					600,
					900,
					1000,
					1400
				]
			}
		}
	},
	"article_with_video":{
		"name": "article_with_video",
		"path":"05faa536-d3ab-11e4-a9d3-00144feab7de",
		"elements":{
			"header_logo": {
				"name":"header_logo",
				"css":'.next-header__logo--ft',
				"widths":[
					500,
					1400
				]
			}
		}
	}
};
