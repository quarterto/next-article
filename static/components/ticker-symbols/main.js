
// Enhances any ticker symbol found on the page with live pricing data
function init () {

    var host = 'http://next-companies-et-al.herokuapp.com/v1/mouseover/company/';
    var symbols = document.querySelectorAll('.article-card__ticker-symbol');
    
    [].slice.call(symbols).forEach(function (symbol) {
        var code = symbol.getAttribute('data-ticker-symbol');
        console.log(code, host + code);
        reqwest(host + symbol, function (resp) {
           
            // did the market price go up?
            var isUp = parseFloat(resp.latest_change.percentage) >= 0; 
            var price = resp.latest_price.amount;
            var change = resp.latest_change.percentage;

            console.log(price, isUp);
        })
    })

}

init();
