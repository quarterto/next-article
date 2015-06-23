'use strict';

var cheerio = require('cheerio');

module.exports = function($, flags) {
	if (flags.articleComboComponents) {
		// HACK: for now, shove two a big numbers after the 3rd para
		$.root().find('body').children('p').eq(2).after(
			'<big-number>' +
				'<big-number-headline><p>$588m</p></big-number-headline>' +
				'<big-number-intro>' +
					'<p>Loaned by the World Bank to build a new Damn on the Indus River in Pakistan - another large backer is the Industrial and Commercial Bank of China</p>' +
				'</big-number-intro>' +
			'</big-number>' +
			'<big-number>' +
				'<big-number-headline><p>$588m</p></big-number-headline>' +
				'<big-number-intro>' +
					'<p>Loaned by the World Bank to build a new Damn on the Indus River in Pakistan - another large backer is the Industrial and Commercial Bank of China</p>' +
				'</big-number-intro>' +
			'</big-number>'
		);
		// HACK: and a big number and pull quote after the 5th
		$.root().find('body').children('p').eq(4).after(
			'<big-number>' +
				'<big-number-headline><p>$588m</p></big-number-headline>' +
				'<big-number-intro>' +
					'<p>Loaned by the World Bank to build a new Damn on the Indus River in Pakistan - another large backer is the Industrial and Commercial Bank of China</p>' +
				'</big-number-intro>' +
			'</big-number>' +
			'<pull-quote>' +
				'<pull-quote-text>' +
					'<p>I will do everything in my power to work with the Asian Infrastructure Investment Bank. There’s more than enough projects to go round</p>' +
				'</pull-quote-text>' +
				'<pull-quote-source>Jim Yong Kim, <br/>World Bank President</pull-quote-source>' +
			'</pull-quote>'
		);

		$('big-number, pull-quote').each(function (index, el) {
			var $component = cheerio(el);
			var $prevComponent = $component.prev();
			if (['big-number', 'pull-quote'].indexOf($prevComponent.get(0).tagName) === -1) {
				return;
			}
			var componentHtml = $.html($component);
			var prevComponenHtml = $.html($prevComponent);
			$prevComponent.remove();
			return $component.replaceWith(
				'<div class="article__combo article__combo--multiple-big-number">' +
					prevComponenHtml +
					componentHtml +
				'</div>'
			);
		});
	}

	return $;
};
