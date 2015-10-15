"use strict";

var generateToken = require('article-token-creator');
var shareCodeCreator = require('share-code-creator');
var decrypt = shareCodeCreator.decrypt;
var isShareCodePattern = shareCodeCreator.isShareCodePattern;
var privateKey = process.env.TOKEN_GENERATING_PRIVATE_KEY;

module.exports = function (req, res, next) {
	var code = req.query.share_code;
	var article = req.params.id;

	if (req.header('FT-User-UUID') === undefined || req.header('FT-User-UUID') === null) {
		if (isShareCodePattern(code)) {
			var sharingUserID = decrypt(code, article);

			if (true) { // need to check the user ID is infact a user -- may want to check dam or subs to see if they are allowed to share the article and have tokens left
				res.append('Set-Cookie', generateToken(article, privateKey));
				return res.redirect('/content/' + req.params.id);
			}
		}
	}

	// if the user is logged in and can already view the article, no need to create a gift token
	return next();
};