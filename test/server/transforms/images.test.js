/*global describe, it, beforeEach*/
'use strict';

// HACK (needs fetch to be defined)
require('ft-next-express');

var $ = require('cheerio');
require('chai').should();
var nock = require('nock');

var images = require('../../../server/transforms/images');
var imageSet = require('fs').readFileSync('test/fixtures/image-set.json', { encoding: 'utf8' });
var imageSet2 = require('fs').readFileSync('test/fixtures/image-set-2.json', { encoding: 'utf8' });

describe('Images', function() {

	var flags = {
		fullWidthMainImages: true
	};

	beforeEach(function() {
		nock('http://api.ft.com')
			.get('/content/f14a7e9e-cc08-11e4-30d3-978e959e1c97')
			.reply(200, imageSet)
			.get('/content/2ad940b2-cc01-11e4-30d3-978e959e1c97')
			.reply(200, imageSet2)
			.get('/content/7a68fee4-cc22-11e4-20ac-978e959e1c97')
			.reply('404');
	});

	it('should convert an ft-content to an image', function() {
		var $content = $.load('');
		$content.root().append(
			'<ft-content data-embedded="true" type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/f14a7e9e-cc08-11e4-30d3-978e959e1c97"></ft-content>'
		);

		return images($content, flags)
			.then(function($content) {
				$content.html().should.equal(
					'<figure class="article__image-wrapper ng-figure-reset article__main-image ng-media-wrapper">' +
						'<img class="article__image ng-media" src="https://next-geebee.ft.com/image/v1/images/raw/http%3A%2F%2Fcom.ft.imagepublish.prod.s3.amazonaws.com%2Ff14a7e9e-cc08-11e4-aeb5-00144feab7de?source=next&amp;fit=scale-down&amp;width=710" alt="">' +
						'<figcaption class="article__image-caption ng-meta">American staples old and new: from top, Campbell&#x2019;s Soup, hot dogs and kale. Below, Annie&#x2019;s Homegrown co-founder Annie Withey</figcaption>' +
					'</figure>'
				);
			});
	});

	it('should convert multiple ft-content to images', function() {
		var $content = $.load('');
		$content.root().append(
			'<ft-content data-embedded="true" type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/f14a7e9e-cc08-11e4-30d3-978e959e1c97"></ft-content>' +
			'<ft-content data-embedded="true" type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/2ad940b2-cc01-11e4-30d3-978e959e1c97"></ft-content>'
		);

		return images($content, flags)
			.then(function($content) {
				$content.html().should.equal(
					'<figure class="article__image-wrapper ng-figure-reset article__main-image ng-media-wrapper">' +
						'<img class="article__image ng-media" src="https://next-geebee.ft.com/image/v1/images/raw/http%3A%2F%2Fcom.ft.imagepublish.prod.s3.amazonaws.com%2Ff14a7e9e-cc08-11e4-aeb5-00144feab7de?source=next&amp;fit=scale-down&amp;width=710" alt="">' +
						'<figcaption class="article__image-caption ng-meta">American staples old and new: from top, Campbell&#x2019;s Soup, hot dogs and kale. Below, Annie&#x2019;s Homegrown co-founder Annie Withey</figcaption>' +
					'</figure>' +
					'<figure class="article__image-wrapper ng-figure-reset article__inline-image ng-pull-out ng-inline-element">' +
						'<img class="article__image" src="https://next-geebee.ft.com/image/v1/images/raw/http%3A%2F%2Fcom.ft.imagepublish.prod.s3.amazonaws.com%2F2ad940b2-cc01-11e4-aeb5-00144feab7de?source=next&amp;fit=scale-down&amp;width=600" alt="">' +
					'</figure>'
				);
			});
	});

	it('should remove ft-content if image request fails', function() {
		var $content = $.load('');
		$content.root().append(
			'<ft-content data-embedded="true" type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/f14a7e9e-cc08-11e4-30d3-978e959e1c97"></ft-content>' +
			'<ft-content data-embedded="true" type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/7a68fee4-cc22-11e4-20ac-978e959e1c97"></ft-content>'
		);

		return images($content, flags)
			.then(function($content) {
				$content.html().should.equal(
					'<figure class="article__image-wrapper ng-figure-reset article__main-image ng-media-wrapper">' +
						'<img class="article__image ng-media" src="https://next-geebee.ft.com/image/v1/images/raw/http%3A%2F%2Fcom.ft.imagepublish.prod.s3.amazonaws.com%2Ff14a7e9e-cc08-11e4-aeb5-00144feab7de?source=next&amp;fit=scale-down&amp;width=710" alt="">' +
						'<figcaption class="article__image-caption ng-meta">American staples old and new: from top, Campbell&#x2019;s Soup, hot dogs and kale. Below, Annie&#x2019;s Homegrown co-founder Annie Withey</figcaption>' +
					'</figure>'
				);
			});
	});

	it('should not show main image if `fullWidthMainImages` flag is off', function() {
		var $content = $.load('');
		$content.root().append(
			'<ft-content data-embedded="true" type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/f14a7e9e-cc08-11e4-30d3-978e959e1c97"></ft-content>'
		);

		return images($content, { fullWidthMainImages: false })
			.then(function($content) {
				$content.html().should.equal(
					'<figure class="article__image-wrapper ng-figure-reset article__inline-image ng-pull-out ng-inline-element">' +
						'<img class="article__image" src="https://next-geebee.ft.com/image/v1/images/raw/http%3A%2F%2Fcom.ft.imagepublish.prod.s3.amazonaws.com%2Ff14a7e9e-cc08-11e4-aeb5-00144feab7de?source=next&amp;fit=scale-down&amp;width=600" alt="">' +
						'<figcaption class="article__image-caption ng-meta">American staples old and new: from top, Campbell&#x2019;s Soup, hot dogs and kale. Below, Annie&#x2019;s Homegrown co-founder Annie Withey</figcaption>' +
					'</figure>'
				);
			});
	});

	it('should not show main image if no flags', function() {
		var $content = $.load('');
		$content.root().append(
			'<ft-content data-embedded="true" type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/f14a7e9e-cc08-11e4-30d3-978e959e1c97"></ft-content>'
		);

		return images($content)
			.then(function($content) {
				$content.html().should.equal(
					'<figure class="article__image-wrapper ng-figure-reset article__inline-image ng-pull-out ng-inline-element">' +
						'<img class="article__image" src="https://next-geebee.ft.com/image/v1/images/raw/http%3A%2F%2Fcom.ft.imagepublish.prod.s3.amazonaws.com%2Ff14a7e9e-cc08-11e4-aeb5-00144feab7de?source=next&amp;fit=scale-down&amp;width=600" alt="">' +
						'<figcaption class="article__image-caption ng-meta">American staples old and new: from top, Campbell&#x2019;s Soup, hot dogs and kale. Below, Annie&#x2019;s Homegrown co-founder Annie Withey</figcaption>' +
					'</figure>'
				);
			});
	});

	it('should not add image classes if in promobox', function() {
		var $content = $.load('');
		$content.root().append(
			'<div class="article__promo-box">' +
				'<ft-content data-embedded="true" type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/f14a7e9e-cc08-11e4-30d3-978e959e1c97"></ft-content>' +
			'</div>'
		);

		return images($content)
			.then(function($content) {
				$content.html().should.equal(
					'<div class="article__promo-box">' +
						'<figure class="article__image-wrapper ng-figure-reset article__promo-box__image">' +
							'<img class="article__image" src="https://next-geebee.ft.com/image/v1/images/raw/http%3A%2F%2Fcom.ft.imagepublish.prod.s3.amazonaws.com%2Ff14a7e9e-cc08-11e4-aeb5-00144feab7de?source=next&amp;fit=scale-down&amp;width=600" alt="">' +
							'<figcaption class="article__image-caption ng-meta">American staples old and new: from top, Campbell&#x2019;s Soup, hot dogs and kale. Below, Annie&#x2019;s Homegrown co-founder Annie Withey</figcaption>' +
						'</figure>' +
					'</div>'
				);
			});
	});

	it('should move images out of containing `p`s', function() {
		var $content = $.load('');
		$content.root().append(
			'<p>' +
				'<ft-content data-embedded="true" type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/f14a7e9e-cc08-11e4-30d3-978e959e1c97"></ft-content>' +
				'Some text' +
			'</p>'
		);

		return images($content)
			.then(function($content) {
				$content.html().should.equal(
					'<figure class="article__image-wrapper ng-figure-reset article__inline-image ng-pull-out ng-inline-element">' +
						'<img class="article__image" src="https://next-geebee.ft.com/image/v1/images/raw/http%3A%2F%2Fcom.ft.imagepublish.prod.s3.amazonaws.com%2Ff14a7e9e-cc08-11e4-aeb5-00144feab7de?source=next&amp;fit=scale-down&amp;width=600" alt="">' +
						'<figcaption class="article__image-caption ng-meta">American staples old and new: from top, Campbell&#x2019;s Soup, hot dogs and kale. Below, Annie&#x2019;s Homegrown co-founder Annie Withey</figcaption>' +
					'</figure>' +
					'<p>Some text</p>'
				);
			});
	});

});
