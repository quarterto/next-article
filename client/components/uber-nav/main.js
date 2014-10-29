var reqwest = require('../../vendor/reqwest.min');
reqwest('/uber-nav', function(resp) {
    document.querySelector('.js-splash').innerHTML = resp;
});

