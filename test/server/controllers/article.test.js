/*global it, describe*/
'use strict';

var expect = require('chai').expect;
require('chai').should();
var request = require('request');
var $ = require('cheerio');

var helpers = require('../helpers');

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

	describe('Follow buttons', function() {

		it('should have concept ids on all follow buttons in article', function(done) {
			helpers.mockMethode();
			request(helpers.host + '/02cad03a-844f-11e4-bae9-00144feabdc0', function(error, response, body) {
				$(body).find('.n-myft-ui--follow').each(function(index, el) {
					var $form = $(el);
					expect($form.attr('data-concept-id')).to.not.be.empty;
					expect($form.find('input[name="name"]').attr('value')).to.not.be.empty;
					expect($form.find('input[name="taxonomy"]').attr('value')).to.not.be.empty;
				});
				done();
			});
		});

	});
};
