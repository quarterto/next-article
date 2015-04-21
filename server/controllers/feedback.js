'use strict';

var GoogleSpreadsheet = require('google-spreadsheet');
var denodeify = require('denodeify');
var authenticate = denodeify(require('google-oauth-jwt').authenticate);

var gDocsServiceEmail = process.env.GDOCS_SERVICE_EMAIL;
var gDocsPemKeyBase64 = process.env.GDOCS_PEM_KEY_BASE64;
var gDocsSheetId = '1C9MKgm77CD38MPJr9vWmd87mEt8JNLegLzdXQ42zkp4';

function login(opts) {
	return authenticate({
		scopes: ['https://spreadsheets.google.com/feeds'],
		email: opts.email,
		key: opts.key
	})
		.then(function(token) {
			console.log("Got token", token);
			return { type: 'Bearer', value: token };
		})
		.catch(function(err) {
			console.log(err);
			throw new Error('Authenticate error');
		});
}

module.exports = function(req, res, next) {
	res.set({ 'Cache-Control': 'private' });
	login({
		email: gDocsServiceEmail,
		key: new Buffer(gDocsPemKeyBase64, 'base64')
	})
		.then(function(authObj) {
			var sheet = new GoogleSpreadsheet(gDocsSheetId, authObj);
			var addRow = denodeify(sheet.addRow);
			var now = new Date();
			var timeOpts = { timeZone: 'Europe/London' };
			console.log("About to add row");
			return addRow('od6', {
				Date: now.toLocaleDateString('en-GB', timeOpts) + ' ' + now.toLocaleTimeString('en-GB', timeOpts),
				Article: req.params.id,
				Reason: decodeURIComponent(req.params.reason),
				Contactable: false,
				ErightsId: req.headers['x-ft-user-id'],
				Email: ''
			});

		})
		.then(function() {
			console.log("success");
			res.sendStatus(202);
		})
		.catch(next);
};
