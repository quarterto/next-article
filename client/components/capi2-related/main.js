/* global fetch*/
'use strict';

var container = document.querySelector('.article-card__mentions');

if (container) {
	container.querySelector('.article-card__mentions__toggle').addEventListener('click', function (ev) {
		var wasCollapsed = container.getAttribute('aria-expanded') === 'false';
		container.setAttribute('aria-expanded',  wasCollapsed ? true : false);
		ev.currentTarget.innerHTML = wasCollapsed ? 'view fewer<i class="icon-arrow-up"></i>' : 'view more<i class="icon-arrow-down"></i>';
	});
}