'use strict';

var cheerio = require('cheerio');

module.exports = function($, flags) {
	// HACK - ugh, way of only running this on /54fba5c4-e2d6-11e4-aa1d-00144feab7de for now
	var firstImageUrl = $('body > ft-content:first-child').attr('url');
	if (flags.articleComboComponents && firstImageUrl && firstImageUrl.indexOf('dff6df70-e454-11e4-0e5f-978e959e1c97') !== -1) {
		// HACK: for now, shove two images in
		$.root().find('body').children('p').eq(30).after(
			'<ft-content type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/fee5c268-1675-11e5-1ef3-978e959e1689" data-embedded="true"></ft-content>' +
			'<ft-content type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/dff6df70-e454-11e4-0e5f-978e959e1c97" data-embedded="true"></ft-content>'
		);

		$('ft-content[type$="ImageSet"]').each(function (index, image) {
			var $image = cheerio(image);
			var $elPrev = $image.prev();
			if (!$elPrev.is('ft-content[type$="ImageSet"]')) {
				return;
			}
			var elPrevHtml = $.html($elPrev);
			$elPrev.remove();
			$image.replaceWith(
				'<div class="article__combo article__combo--double-image">' +
					elPrevHtml +
					$.html(image) +
				'</div>'
			);
		});
	}

	return $;
};
