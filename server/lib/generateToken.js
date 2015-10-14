"use strict";

var uuid = require('uuid');
var NodeRSA = require('node-rsa');
var fs = require('fs');
var path = require('path');
var TextEncoder = require('text-encoding').TextEncoder;
var atob = require('base-64').decode;
var btoa = require('base-64').encode;
var escape = require('base64-url').escape;
var key = new NodeRSA(process.env.TOKEN_GENERATING_PRIVATE_KEY);

function createCookie(name,value,domain,days) {
	var expires = "";
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires = "; expires="+date.toGMTString();
	}

	if (domain) {
		return name+"="+value+expires+"; path=/; "+"domain="+domain;
	} else {
		return name+"="+value+expires+"; path=/";
	}
}

module.exports = function(articleUUID, res) {
	var now = new Date();
	var oneMonthFromNow = new Date(new Date(now).setMonth(now.getMonth() + 1));

	var guestpasses = [
		{
			"uid": articleUUID,
			"token": uuid.v4(),
			"expires": oneMonthFromNow
		}
	];

	var s = JSON.stringify(guestpasses);

	var guestpassesUTF8 = new TextEncoder('utf-8').encode(s);

	var signature = escape(btoa(atob(key.sign(s, 'base64'))));
	var encodedSignature = signature;

	var guestpassCookieValue = btoa(JSON.stringify({
		"guestpasses": guestpasses,
		"publickey": "https://registration.ft.com/guestpass/publickey/dcbdf3be-fb40-4939-aff7-e31b668384ea",//"http://labs.ft.com/wp-content/themes/ftlabs/branding/mykey.pub",
		"signature": encodedSignature
	}));

	res.append('Set-Cookie', createCookie('GuestPass', guestpassCookieValue, '.ft.com', 30));
};
