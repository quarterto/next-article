"use strict";

var generateToken = require('article-token-creator');
var shareCodeCreator = require('share-code-creator');
var decrypt = shareCodeCreator.decrypt;
var isShareCodePattern = shareCodeCreator.isShareCodePattern;
var privateKey = process.env.TOKEN_GENERATING_PRIVATE_KEY;
var userApiUrl = 'https://user-api-uk-prod.apps.memb.ft.com:8443/membership/users/v1/';

module.exports = function (req, res, next) {
	var code = req.query.share_code;
	var article = req.params.id;

	if (req.header('FT-User-UUID') === undefined || req.header('FT-User-UUID') === null) {
		if (isShareCodePattern(code)) {
			var sharingUserID = decrypt(code, article);
			fetch(userApiUrl + sharingUserID)
			.then(userApiResponse => {
				if (userApiResponse.status === 200) {
					res.append('Set-Cookie', generateToken(article, privateKey));
					return res.redirect('/content/' + req.params.id);
				}
			});
		}
	}

	// if the user is logged in and can already view the article, no need to create a gift token
	return next();
};