/* global describe, it */
'use strict';

var transform = require('./transform-helper');
require('chai').should();

describe('Big Number', function () {

	it('should transform html to article-big-number format', function () {
		return transform(
				'<body>' +
					'<big-number>' +
						'<big-number-headline>33m</big-number-headline>' +
						'<big-number-intro>These are powerful but fragile emissaries of a culture that not even their descendants remember</big-number-intro>' +
					'</big-number>' +
				'</body>'
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<div class="article-big-number aside--content n-content-box n-content-box--inline u-border--all u-padding--left-right">' +
						'<span class="article-big-number__title">33m</span>' +
						'<span class="article-big-number__content">These are powerful but fragile emissaries of a culture that not even their descendants remember</span>' +
					'</div>\n'
				);
			});
	});

	it('should maintain html', function () {
		return transform(
				'<body>' +
					'<big-number>' +
						'<big-number-headline><a href="http://next.ft.com/1b852d96-ced7-11e4-893d-00144feab7de">33m</a></big-number-headline>' +
						'<big-number-intro>These are <a href="http://next.ft.com/712943a2-cda3-11e4-8760-00144feab7de">powerful but fragile</a> emissaries of a culture that not even their descendants remember</big-number-intro>' +
					'</big-number>' +
				'</body>'
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<div class="article-big-number aside--content n-content-box n-content-box--inline u-border--all u-padding--left-right">' +
						'<span class="article-big-number__title"><a href="http://next.ft.com/1b852d96-ced7-11e4-893d-00144feab7de" data-trackable="link">33m</a></span>' +
						'<span class="article-big-number__content">These are <a href="http://next.ft.com/712943a2-cda3-11e4-8760-00144feab7de" data-trackable="link">powerful but fragile</a> emissaries of a culture that not even their descendants remember</span>' +
					'</div>\n'
				);
			});
	});

});
