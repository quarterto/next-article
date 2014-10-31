'use strict';

module.exports = function (req, res, next) {
    res.ft.viewData = res.ft.viewData || {};
    res.set({
        'Cache-Control': 'max-age=120, public'
    });
    res.render(res.ft.template, res.ft.viewData);
};