'use strict';

exports.ft = require('ft-api-client')(process.env.apikey);
exports.fastft = require('fastft-api-client');

exports.fastft.config('host', 'http://clamo.ftdata.co.uk/api');
exports.fastft.config('timeout', 4000);
