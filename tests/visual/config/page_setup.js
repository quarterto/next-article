"use strict";

// Define each page you want to test, which elements you want to check on each page, and
// at which browser widths those elements should appear
// One process is started per page/width combination, so if you can pick a width that's already
// in play, it will save resources.

module.exports = {
	"article_with_image": {
		"name": "article_with_image",
		"path": "ccf7af08-e904-11e4-a71a-00144feab7de",
		"elements": {
			"header": {
				"name":"header_logo",
				"css":'.article__header',
				"widths":[
					500,
					1400
				]
			}
		}
	}
};
