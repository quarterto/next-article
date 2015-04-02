'use strict';

var fetchres = require('fetchres');

var $ = function(selector) {
	return [].slice.call(document.querySelectorAll(selector));
};

module.exports = function () {
	var stockPromises = $('.js-markets-data').map(function (el) {
		var tickerSymbol = el.getAttribute('data-ticker-symbol');

		return fetch('http://ft-next-markets-proxy-api.herokuapp.com/securities/v1/quotes?symbols=' + tickerSymbol)
			.then(fetchres.json)
			.then(function (response) {
				var data = response.data.items[0];
				var change = Math.round(data.quote.change1DayPercent * 100) / 100;
				if (change > 0) {
					change = '+' + change;
				} else if (change < 0) {
					change = '-' + change;
				}
				var stockEl = document.createElement('div')
				stockEl.className = 'market-data';
				stockEl.innerHTML =
					'<p class="market-data__title"><span class="market-data__symbol">' + data.basic.symbol + '</span> Today‘s change</p>' +
					'<p class="market-data__price">' + (Math.round(data.quote.lastPrice * 100) / 100) + '</p>' +
					'<p class="market-data__change">' + change + '%</p>';
				el.appendChild(stockEl);
				return response;
			})
			.catch(function (err) {
				return null;
			});
	});

	return Promise.all(stockPromises);
};
