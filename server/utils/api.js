'use strict';
var raven = require('express-errors-handler');
var Metrics = require('next-metrics');

var ftErrorHandler = (process.env.NODE_ENV === 'production') ? function(err) {
	raven.captureMessage(err);
} : function(err) {
	console.log(err);
};

exports.ft = require('ft-api-client')(process.env.apikey, {
	errorHandler: ftErrorHandler
});

exports.fastft = require('fastft-api-client');

exports.fastft.config('host', 'http://clamo.ftdata.co.uk/api');
exports.fastft.config('timeout', 4000);

Metrics.instrument(exports.ft, { as: 'ft-api-client' });
