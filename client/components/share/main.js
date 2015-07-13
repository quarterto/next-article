'use strict';

var oShare = require('o-share');

function decodeHtml(html) {
    var txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}


exports.init = function() {
	var shareContainer = document.querySelector('[data-o-component=o-share]');

	new oShare(shareContainer);

	var whatsapp = shareContainer.querySelector('[data-share-target="whatsapp"]');
	if(whatsapp) {
		whatsapp.parentElement.classList.remove('article-share__hidden');
		var text = decodeHtml(whatsapp.getAttribute('data-share-title')) + ' - ' + whatsapp.getAttribute('data-share-url') ;
		whatsapp.href="whatsapp://send?text=" + encodeURIComponent(text);
	}
};
