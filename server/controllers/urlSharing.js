"use strict";

var atob = require('base-64').decode;
var R = require('ramda');

var generateToken = require('../lib/generateToken');
var decrypt = require('share-code-creator').decrypt;

var shareCodeRegex = /[a-z0-9]{32}/
var isShareCode = shareCodeRegex.test.bind(shareCodeRegex);

module.exports = function (req, res, next) {
	var code = req.query.share_code;
	var article = req.params.id;

	if (isShareCode(code)) {
		var sharingUserID = decrypt(code, article);
		console.log("userID:", sharingUserID)

		if (true) { // need to check the user ID is infact a user -- may want to check dam or subs to see if they are allowed to share the article and have tokens left
			var hasFTUser = R.has('FT_User');
			var getFTUser = R.prop('FT_User');
			var individiualCookieProperties = R.split(':');
			var isUserIDOrErightsID = prop => prop.startsWith('USERID') || prop.startsWith('ERIGHTSID');
			var splitKeyAndValue = R.split('=');

			if (hasFTUser(req.cookies)) { // if the user is logged in and can already view the article, no need to create a gift token
				var userInfo = new Map(R.map(splitKeyAndValue, R.filter(isUserIDOrErightsID, individiualCookieProperties(getFTUser(req.cookies)))));
				return next();
			} else {
				var token = generateToken(article, res);
				return res.redirect('/content/' + req.params.id);
			}
		} else {
			return next();
		}
	} else {
		return next();
	}
};