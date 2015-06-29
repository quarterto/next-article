"use strict";

var cheerio = require('cheerio');

module.exports = function($, flags) {
	if (flags.articleComboComponents) {
		$('pull-quote').each(function (index, el) {
			var $el = cheerio(el);
			/**
			 * HACK: assumes the html for a 'image/pull-quote combo' is of the format
			 * <p>
			 *     <ft-content ...></ft-content>
			 * </p>
			 * <pull-quote>...</pull-quote>
			 */
			var $p = $el.prev();
			var $pChildren = $p.children();
			var $image = $p.find('ft-content[type$="ImageSet"]');
			if (!$p.get(0) || $p.get(0).tagName !== 'p' || $pChildren.length !== 1 || $image.length !==1) {
				return;
			}
			$image.remove();
			var text = $el.find('pull-quote-text').text();
			var cite = $el.find('pull-quote-source').text();
			$el.replaceWith(
				'<div class="article__combo article__combo--pull-quote">' +
					'<ft-content type="' + $image.attr('type') + '" url="' + $image.attr('url') + '"></ft-content>' +
					'<blockquote class="article__combo__pull-quote">' +
						'<p>' + text + '</p>' +
						(cite ? '<cite>' + cite + '</cite>' : '') +
					'</blockquote>' +
				'</div>'
			);
		});
	}

	return $;
};
