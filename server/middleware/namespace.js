'use strict';

module.exports = function (req, res, next) {
    req.ft = res.ft = {};
    next();
};