'use strict';

var request = require('request');

module.exports = function(req, res, next) {
    request({
        url: 'http://next-companies-et-al.herokuapp.com/v1/ubernav.json',
        json: true
    }, function (err, response, body) {
        res.ft.template = 'components/uber-nav';
        res.ft.viewData = body;
        next();
    });
};