'use strict';

var request = require('request');

module.exports = function(req,res,next) {
    var userId = req.query.user;
    var query = '';
    var streams = [];
    if(!userId) {
        res.status(404).send();
    }
    var list = request.get({
        url: 'http://ft-next-api-user-prefs.herokuapp.com/user/favourites',
        headers: {
            'X-FT-UID': userId
        }
    }, function(err, resp) {
        if(resp.body) {
            streams = JSON.parse(resp.body);
            query = streams.map(function(el) {
                return el.uuidv3;
            }).join(' OR ');
        }
        req.url = '/search';
        req.query = {
            q: query,
            friendly: 'favourites',
            isFollowable: false
        };
        next('route');

        // res.redirect('/search?friendly=favourites&q=' + query);
    });
};