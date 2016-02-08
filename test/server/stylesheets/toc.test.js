/* global describe, it */
'use strict';

var transform = require('./transform-helper');
require('chai').should();

describe('Table of Contents', () => {

	it('should create a table of contents', () => {
		return transform(
			'<html>' +
				'<body>' +
					'<h3 class="ft-subhead"><strong>First heading</h3></strong>' +
					'<h3 class="ft-subhead"><strong>Second heading</h3></strong>' +
					'<h3 class="ft-subhead"><strong>Third heading</h3></strong>' +
				'</body>' +
			'</html>', {renderTOC: 1}
		)
		.then(transformedXml => {
			transformedXml.should.equal(
				'<div class="article__toc" data-trackable="table-of-contents">' +
					'<h2 class="article__toc__title">In this article</h2>' +
					'<ol class="article__toc__chapters ng-list-reset">' +
						'<li class="article__toc__chapter">' +
							'<a class="article__toc__link" href="#crosshead-1" data-trackable="toc">First heading</a>' +
						'</li>' +
						'<li class="article__toc__chapter">' +
							'<a class="article__toc__link" href="#crosshead-2" data-trackable="toc">Second heading</a>' +
						'</li>' +
						'<li class="article__toc__chapter">' +
							'<a class="article__toc__link" href="#crosshead-3" data-trackable="toc">Third heading</a>' +
						'</li>' +
					'</ol>' +
				'</div>' +
				'<h2 id="crosshead-1" class="subhead subhead--crosshead">First heading</h2>' +
				'<h2 id="crosshead-2" class="subhead subhead--crosshead">Second heading</h2>' +
				'<h2 id="crosshead-3" class="subhead subhead--crosshead">Third heading</h2>\n'
			)
		});
	});
});
