var reqwest = require('reqwest/reqwest.min');
    
var $ = function (selector) {
    return [].slice.call(document.querySelectorAll(selector));
};

$('.js-on-this-topic').forEach(function (el) {
    reqwest('/more-on/' + el.getAttribute('data-metadata-field') + '/' + el.getAttribute('data-article-id'))
        .then(function (resp) {
            el.innerHTML = resp;
            if (window.Origami) {
                window.Origami['o-date'].init(el);
            }
        }, function() {
            el.parentNode.removeChild(el);
        });
});





