(function() {
    reqwest('/uber-nav', function(resp) {
        document.querySelector('.js-splash').innerHTML = resp;
    });
})();
