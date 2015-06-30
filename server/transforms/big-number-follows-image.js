"use strict";

var cheerio = require('cheerio');

module.exports = function($, flags) {
	if (flags.articleComboComponents) {
		$('big-number').each(function (index, el) {
			var $el = cheerio(el);
			/**
			 * HACK: assumes the html for a 'image/pull-quote combo' is of the format
			 * <p>
			 *     <ft-content ...></ft-content>
			 * </p>
			 * <big-number>...</big-number>
			 */
			var $p = $el.prev();
			var $pChildren = $p.children();
			var $image = $p.find('ft-content[type$="ImageSet"]');
			if (!$p.get(0) || $p.get(0).tagName !== 'p' || $pChildren.length !== 1 || $image.length !==1) {
				return;
			}
			$image.remove();
			var title = $el.find('big-number-headline').html();
			var content = $el.find('big-number-intro').html();
			$el.replaceWith(
				'<div class="article__combo article__combo--big-number">' +
					'<ft-content type="' + $image.attr('type') + '" url="' + $image.attr('url') + '"></ft-content>' +
					'<span class="article__combo__big-number">' +
						'<span class="o-big-number__title">' +
							title +
						'</span>' +
						'<span class="o-big-number__content">' +
							content +
						'</span>' +
					'</span>' +
				'</div>'
			);
		});
	}

	return $;
};
