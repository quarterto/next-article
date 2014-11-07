
var reqwest = require('../../vendor/reqwest.min');

// Enhances any ticker symbol found on the page with live pricing data
function init () {

    console.log('prog enhance ticker');

    var host = 'http://next-companies-et-al.herokuapp.com/v1/mouseover/company/';
    var symbols = document.querySelectorAll('.article-full__ticker-symbols__item');

    [].slice.call(symbols).forEach(function (symbol) {
        var code = symbol.getAttribute('data-ticker-symbols');
        reqwest(host + code, function (resp) {
            // did the market price go up?
            var isUp = (parseFloat(resp.data.latest_change.percentage) >= 0) ? 'up' : 'down'; 
            var price = resp.data.latest_price.amount;
            var change = resp.data.latest_change.percentage;
            symbol.innerHTML = '<span class="article-full__ticker-symbols__item-' + isUp + '">' + resp.data.returned_symbol + ' ' + price + ' (' + change  + ')</span>';
        });
    });

}

init();
