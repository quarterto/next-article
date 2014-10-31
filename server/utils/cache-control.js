'use strict';

module.exports = function (res) {
    if(!res.get('Cache-Control')) {
        res.set({
            'Cache-Control': 'max-age=120, public'
        });
    }
};