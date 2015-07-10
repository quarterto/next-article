/* global describe, it */
'use strict';

var denodeify = require('denodeify');
var articleXSLT = require('../../../server/transforms/article-xslt');
require('chai').should();

function transform(xml) {
	return articleXSLT(xml, 'main');
}

describe('Big Number', function () {

	it('should transform html to o-big-number format', function () {
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
					'<body>' +
						'<div class="article__big-number ng-pull-out ng-inline-element o-big-number o-big-number--standard">' +
							'<span class="o-big-number__title">33m</span>' +
							'<span class="o-big-number__content">These are powerful but fragile emissaries of a culture that not even their descendants remember</span>' +
						'</div>' +
					'</body>\n'
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
					'<body>' +
						'<div class="article__big-number ng-pull-out ng-inline-element o-big-number o-big-number--standard">' +
							'<span class="o-big-number__title"><a data-trackable="link" href="http://next.ft.com/1b852d96-ced7-11e4-893d-00144feab7de">33m</a></span>' +
							'<span class="o-big-number__content">These are <a data-trackable="link" href="http://next.ft.com/712943a2-cda3-11e4-8760-00144feab7de">powerful but fragile</a> emissaries of a culture that not even their descendants remember</span>' +
						'</div>' +
					'</body>\n'
				);
			});
	});

});
