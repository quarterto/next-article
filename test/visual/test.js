"use strict";

var visualRegressionTest = require('myrtlejs');
var system = require('system');

visualRegressionTest({
	hosts: {
		base: require('../../package.json').name + '.herokuapp.com',
		test: system.env.TEST_APP + '.herokuapp.com'
	},
	tests: {
		article_without_image: {
			path: "/d0377096-f290-11e4-b914-00144feab7de",
			widths: [500, 1400],
			elements: {
				header: '.article__header',
				pullquote: '.n-quote'
			}
		},
		fastft_article: {
			path: "/08939642-75f3-3ea3-8fc6-73a558524ad1",
			widths: [500, 1400],
			elements: {
				article_body: '.n-content-body'
			}
		},
		pull_quote: {
			path: "/af5ea60e-1578-11e5-be54-00144feabdc0",
			widths: [500, 1400],
			elements: {
				article_body: '.n-quote'
			}
		},
		block_quote: {
			path: "/da42476e-7592-379a-ab1e-033b6128d10d",
			widths: [500, 1400],
			elements: {
				article_body: '.article__block-quote'
			}
		},
		promo_box: {
			path: "/b2c235de-166a-11e5-b07f-00144feabdc0",
			widths: [500, 1400],
			elements: {
				article_body: '.promo-box'
			}
		},
		big_number: {
			path: "/2a6c3d6a-0f62-11e5-897e-00144feabdc0",
			widths: [500, 1400],
			elements: {
				article_body: '.article__big-number'
			}
		},
		temporary_opt_out: {
			path: "/a9efefa2-5071-11e3-befe-00144feabdc0",
			widths: [500, 1400],
			elements: {
				article_temp_opt_out: '.article__warning'
			}
		}
	}
});
