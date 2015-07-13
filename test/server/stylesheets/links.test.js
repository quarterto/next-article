/* global describe, it */
'use strict';

var articleXSLT = require('../../../server/transforms/article-xslt');
require('chai').should();

function transform(xml) {
	return articleXSLT(xml, 'main');
}

describe('Links', function () {

	it('should turn capi v2 ft-content links into a tags', function () {
		return transform(
				'<body>' +
					'<ft-content title="Wolfgang Münchau: Draghi’s QE is an imperfect compromise " type="http://www.ft.com/ontology/content/Article" url="http://api.ft.com/content/f203bf76-a241-11e4-bbb8-00144feab7de">aunched a programme of quantitative easing to </ft-content>' +
				'</body>'
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<a href="/f203bf76-a241-11e4-bbb8-00144feab7de" data-trackable="link">aunched a programme of quantitative easing to </a>' +
					'</body>\n'
				);
			});
	});

	it('should turn capi v2 ft-content links with pretty content into pretty links', function() {
		return transform(
				'<body>' +
					'<ft-content title="Wolfgang Münchau: Draghi’s QE is an imperfect compromise " type="http://www.ft.com/ontology/content/Article" url="http://api.ft.com/content/f203bf76-a241-11e4-bbb8-00144feab7de">aunched a programme of <b>quantitative</b> easing to </ft-content>' +
				'</body>'
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<a href="/f203bf76-a241-11e4-bbb8-00144feab7de" data-trackable="link">aunched a programme of <b>quantitative</b> easing to </a>' +
					'</body>\n'
				);
			});
	});

});
