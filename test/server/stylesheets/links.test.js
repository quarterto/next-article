/* global describe, it */
'use strict';

var transform = require('./transform-helper');
require('chai').should();

describe('Links', function () {

	it('decorates links', function () {
		return transform(
				'<body>' +
					'<a title="Wolfgang Münchau: Draghi’s QE is an imperfect compromise " href="/f203bf76-a241-11e4-bbb8-00144feab7de">Launched a programme of quantitative easing to </a>' +
				'</body>'
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<a href="/f203bf76-a241-11e4-bbb8-00144feab7de" data-trackable="link">Launched a programme of quantitative easing to </a>\n'
				);
			});
	});

});
