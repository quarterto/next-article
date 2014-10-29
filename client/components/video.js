'use strict';

var reqwest = require('../vendor/reqwest.min');

window.addEventListener('load', function () {

    var $ = function (selector) {
        return [].slice.call(document.querySelectorAll(selector));
    };


    $('video').forEach(function (el) {


    	reqwest('http://ft-next-brightcove-proxy-api.herokuapp.com/' + el.getAttribute('data-brightcove-ref'))
    		.then(function (resp) {
    			var data = JSON.parse(resp);
    		  	el.src = data.renditions[0].url;
    		}, function () {
    		  	console.log('error: ', arguments);
    		});
    });

}, false);

