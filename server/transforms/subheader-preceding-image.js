"use strict";

var cheerio = require('cheerio');

module.exports = function($, flags) {
	// HACK - ugh, way of only running this on /54fba5c4-e2d6-11e4-aa1d-00144feab7de for now
	var firstImageUrl = $('body > ft-content:first-child').attr('url');
	if (flags.articleComboComponents && firstImageUrl && firstImageUrl.indexOf('dff6df70-e454-11e4-0e5f-978e959e1c97') !== -1) {
		$.root().find('body').children('p').eq(33).after(
			'<h3 class="ft-subhead"><strong>The new big earners</strong></h3>' +
			'<ft-content type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/dff6df70-e454-11e4-0e5f-978e959e1c97" data-embedded="true"></ft-content>'
		);
		$.root().find('body').children('p').eq(35).after(
			'<h3 class="ft-subhead"><strong>The new big earners</strong></h3>' +
			'<ft-content type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/dff6df70-e454-11e4-0e5f-978e959e1c97" data-embedded="true"></ft-content>'
		);

		$('ft-content[type$="ImageSet"]').each(function (index, image) {
			var $image = cheerio(image);
			var $prevEl = $image.prev();
			if (!$prevEl.hasClass('ft-subhead')) {
				return;
			}
			var prevElHtml = $.html($prevEl);
			$prevEl.remove();
			// force the second one to be lifestyle
			var componentType = index % 2 ? 'news' : 'lifestyle';
			$image.replaceWith(
				'<div class="article__combo article__combo--image-with-subheader article__combo--image-with-subheader--' + componentType + '">' +
					prevElHtml +
					$.html($image) +
				'</div>'
			);
		});
	}

	return $;
};
