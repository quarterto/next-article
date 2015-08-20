'use strict';

import SuperStore from 'superstore';
const sessionStore = new SuperStore('session', 'ft');

export function add(id) {
	sessionStore.get('next-reading-history').then(function(articlesRead) {
		if(!articlesRead) {
			articlesRead = [];
		}
		articlesRead.push(id);
		sessionStore.set('next-reading-history', articlesRead);
	});
}
