"use strict";

var visualRegressionTest = require('myrtlejs');
var system = require('system');

visualRegressionTest({
	hosts: {
		base: require('../../package.json').name + '.herokuapp.com',
		test: system.env.TEST_HOST + '.herokuapp.com'
	},
	tests: {
		article_without_image: {
			path: "/d0377096-f290-11e4-b914-00144feab7de",
			widths: [500, 1400],
			elements: {
				header: '.article__header',
				pullquote: '.article__pull-quote'
			}
		},
		fastft_article: {
			path: "/08939642-75f3-3ea3-8fc6-73a558524ad1",
			widths: [500, 1400],
			elements: {
				article_body: '.article__body'
			}
		}
	}
});
