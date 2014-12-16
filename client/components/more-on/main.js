var reqwest = require('reqwest/reqwest.min');
var articleCard = require('next-article-card-component');
var ads = require('next-ads-component');

// Sort of like Promise.all but will be called whether they fail or succeed
Promise.allDone = function(promises){
    return new Promise(function(resolve){
        var count = promises.length,
            doneCount = 0,
            results = [],
            check = function(){
                if(doneCount === count){
                    resolve(results);
                }
            },
            increment = function(result){
                doneCount++;
                results.push();
                check();
            };

        promises.forEach(function(promise){
            promise.then(increment, increment);
        });
    });
};

var initAds = (function(){
    var called = false;
    return function(){
        if(!called){
            ads.init();
            called = true;
        }
    };
}());

var $ = function (selector) {
    return [].slice.call(document.querySelectorAll(selector));
};

var reqwestPromises = [];

$('.js-more-on').forEach(function (el) {
    reqwestPromises.push(reqwest('/more-on/' + el.getAttribute('data-article-id'))
        .then(function (resp) {
            el.innerHTML = resp;
            articleCard.init(el);
        }, function() {
            el.parentNode.removeChild(el);
        }));
});

$('.js-on-this-topic').forEach(function (el) {
    reqwestPromises.push(reqwest('/more-on/' + el.getAttribute('data-metadata-field') + '/' + el.getAttribute('data-article-id'))
        .then(function (resp) {
            el.innerHTML = resp;
            articleCard.init(el);
        }, function() {
            el.parentNode.removeChild(el);
        }));
});

Promise.allDone(reqwestPromises).then(initAds);
