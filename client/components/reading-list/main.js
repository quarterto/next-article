'use strict';

var fetchres = require('fetchres');
var oDate = require('o-date');

module.exports.init = function() {

	var isEmail = document.location.hash.indexOf('myft') > 0;
	var hasSession = document.cookie.match(/FTSession=/);
	if(!isEmail || !hasSession) {
		return;
	}

	fetch('/mypage/feed?limit=40&headingLevel=4&source=email-reading-list',{
		credentials: 'same-origin'
	})
	.then(fetchres.text)
	.then(function(html) {
		if(html && html.length) {
			var container = document.createElement('div');
			container.classList.add('n-reading-list');
			container.insertAdjacentHTML('afterbegin', '<button class="n-reading-list__trigger"><abbr class="myft-ui__icon" title="myFT reading list"></abbr></button>')
			container.insertAdjacentHTML('beforeend', html);
			document.body.appendChild(container);
			oDate.init(container);

			container.querySelector('.n-reading-list__trigger').addEventListener('click', function () {
				this.parentElement.classList.toggle('n-reading-list--open');
			});

		}
	});



}
