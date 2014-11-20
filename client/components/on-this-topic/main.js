var reqwest = require('reqwest/reqwest.min');
var articleCard = require('next-article-card-component');
    
var $ = function (selector) {
    return [].slice.call(document.querySelectorAll(selector));
};

$('.js-on-this-topic').forEach(function (el) {
    reqwest('/more-on/' + el.getAttribute('data-metadata-field') + '/' + el.getAttribute('data-article-id'))
        .then(function (resp) {
            el.innerHTML = resp;
            articleCard.init(el);

        }, function() {
            el.parentNode.removeChild(el);
        });
});





