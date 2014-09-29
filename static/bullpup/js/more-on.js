
(function () {

    window.addEventListener("load", function () {
        
        var $ = function (selector) {
            return [].slice.call(document.querySelectorAll(selector));
        }

        $('.more-on').forEach(function (el) {
            reqwest('/more-on/ ' + el.getAttribute('data-article-id'), function (resp) {
                el.innerHTML = resp;
            })
        })

    }, false);

})();

