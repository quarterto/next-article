'use strict';

module.exports = function (req, res, next) {
    res.render(res.ft.template, res.ft.viewData);
};