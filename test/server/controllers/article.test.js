/*global beforeEach, afterEach, it, describe*/
'use strict';

var expect = require('chai').expect;
require('chai').should();
var request = require('request');
var $ = require('cheerio');
var mitm = require('mitm');

var helpers = require('../helpers');
var articleV2 = require('../../fixtures/capi-v2.json');

module.exports = function () {

	describe('Capi', function() {

		it('should add tracking to all article links', function(done) {
			helpers.mockMethode();
			request(helpers.host + '/02cad03a-844f-11e4-bae9-00144feabdc0', function(error, response, body) {
				$(body).find('.article a').each(function(index, el) {
					var $link = $(el);
					expect($link.attr('data-trackable'), 'href="' + $link.attr('href') + '"').to.not.be.undefined;
				});
				done();
			});
		});
	});
};
