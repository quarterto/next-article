'use strict';

module.exports = function (req, res, next) {
    req.headers['x-ft-next-authorization'] = req.query.authorization || 'ALLOWED';
    next();
};