/*global describe, it, beforeEach*/
'use strict';

// HACK (needs fetch to be defined)
require('ft-next-express');

var $ = require('cheerio');
require('chai').should();
var nock = require('nock');

var images = require('../../../server/transforms/images');
var imageSet1 = require('fs').readFileSync('test/fixtures/image-set-1.json', { encoding: 'utf8' });
var imageSet2 = require('fs').readFileSync('test/fixtures/image-set-2.json', { encoding: 'utf8' });
var imageSet3 = require('fs').readFileSync('test/fixtures/image-set-3.json', { encoding: 'utf8' });

describe('Images', function() {

	var flags = {
		fullWidthMainImages: true,
		reserveSpaceForMasterImage: true
	};

	beforeEach(function() {
		nock('http://api.ft.com')
			.get('/content/f14a7e9e-cc08-11e4-30d3-978e959e1c97')
			.reply(200, imageSet1)
			.get('/content/2ad940b2-cc01-11e4-30d3-978e959e1c97')
			.reply(200, imageSet2)
			.get('/content/1e16e52a-1bd7-11e5-1c67-5c41d9a3bfc9')
			.reply(200, imageSet3)
			.get('/content/7a68fee4-cc22-11e4-20ac-978e959e1c97')
			.reply('404');
	});

	it('should get the image\'s src and caption', function() {
		var $content = $.load('');
		$content.root().append(
			'<figure>'+
				'<picture data-image-set-id="f14a7e9e-cc08-11e4-30d3-978e959e1c97" class="article__image n-image">' +
					'<source data-image-size="690" media="(min-width: 730px)"></source>' +
					'<img data-image-type="src" data-image-size="400" class="n-image__img" alt="">' +
				'</picture>' +
			'</figure>'
		);

		return images($content, flags)
			.then(function($content) {
				$content.html().should.equal(
					'<figure>' +
					'<picture data-image-set-id="f14a7e9e-cc08-11e4-30d3-978e959e1c97" class="article__image n-image">' +
						'<source data-image-size="690" media="(min-width: 730px)" srcset="https://next-geebee.ft.com/image/v1/images/raw/ftcms%3Af14a7e9e-cc08-11e4-aeb5-00144feab7de?source=next&amp;fit=scale-down&amp;width=690">' +
						'<img data-image-type="src" data-image-size="400" class="n-image__img" alt="" src="https://next-geebee.ft.com/image/v1/images/raw/ftcms%3Af14a7e9e-cc08-11e4-aeb5-00144feab7de?source=next&amp;fit=scale-down&amp;width=400">' +
					'</picture>' +
					'<figcaption class="article__image-caption ng-meta">American staples old and new: from top, Campbell&#x2019;s Soup, hot dogs and kale. Below, Annie&#x2019;s Homegrown co-founder Annie Withey</figcaption>' +
					'</figure>'
				);
			});
	});

	it('should get the source and caption for multiple images', function() {
		var $content = $.load('');
		$content.root().append([
				'<figure>' +
					'<picture data-image-set-id="f14a7e9e-cc08-11e4-30d3-978e959e1c97" class="article__image n-image">' +
						'<source data-image-size="690" media="(min-width: 730px)"></source>' +
						'<img data-image-type="src" data-image-size="400" class="n-image__img" alt="">' +
					'</picture>' +
				'</figure>',
				'<figure>' +
					'<picture data-image-set-id="2ad940b2-cc01-11e4-30d3-978e959e1c97" class="article__image n-image">' +
						'<source data-image-size="690" media="(min-width: 730px)"></source>' +
						'<img data-image-type="src" data-image-size="400" class="n-image__img" alt="">' +
					'</picture>' +
				'</figure>'
			].join(''));

		return images($content, flags)
			.then(function($content) {
				$content.html().should.equal([
					'<figure>' +
					'<picture data-image-set-id="f14a7e9e-cc08-11e4-30d3-978e959e1c97" class="article__image n-image">' +
						'<source data-image-size="690" media="(min-width: 730px)" srcset="https://next-geebee.ft.com/image/v1/images/raw/ftcms%3Af14a7e9e-cc08-11e4-aeb5-00144feab7de?source=next&amp;fit=scale-down&amp;width=690">' +
						'<img data-image-type="src" data-image-size="400" class="n-image__img" alt="" src="https://next-geebee.ft.com/image/v1/images/raw/ftcms%3Af14a7e9e-cc08-11e4-aeb5-00144feab7de?source=next&amp;fit=scale-down&amp;width=400">' +
					'</picture>' +
					'<figcaption class="article__image-caption ng-meta">',
						'American staples old and new: from top, Campbell&#x2019;s Soup, hot dogs and kale. Below, Annie&#x2019;s Homegrown co-founder Annie Withey',
					'</figcaption>' +
					'</figure>',
					'<figure>' +
					'<picture data-image-set-id="2ad940b2-cc01-11e4-30d3-978e959e1c97" class="article__image n-image">' +
						'<source data-image-size="690" media="(min-width: 730px)" srcset="https://next-geebee.ft.com/image/v1/images/raw/ftcms%3A2ad940b2-cc01-11e4-aeb5-00144feab7de?source=next&amp;fit=scale-down&amp;width=690">' +
						'<img data-image-type="src" data-image-size="400" class="n-image__img" alt="" src="https://next-geebee.ft.com/image/v1/images/raw/ftcms%3A2ad940b2-cc01-11e4-aeb5-00144feab7de?source=next&amp;fit=scale-down&amp;width=400">' +
					'</picture>' +
					'</figure>'
				].join(''));
			});
	});

});
