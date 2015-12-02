/*global describe, it*/
'use strict';

require('chai').should();
const expect = require('chai').expect;
const cheerio = require('cheerio');
const mainImageAndToc = require('../../../server/transforms/extract-main-image-and-toc');

describe('Extracting Main Image and Table of Contents from Body', () => {

	describe('Main Image', () => {

		it('should extract a full image that is the first element in the body',() => {
			const $ = cheerio.load(
				'<body>' +
					'<figure class="article-image article-image--full" style="width:700px;">' +
						'<div class="article-image__placeholder" style="padding-top:56.25%;">' +
							'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http%3A%2F%2Fcom.ft.imagepublish.prod.s3.amazonaws.com%2F4dd6d624-98cf-11e5-9228-87e603d47bdc?source=next&amp;fit=scale-down&amp;width=700">' +
						'</div>' +
					'</figure>' +
					'<p>test test test</p>' +
				'</body>'
			);
			const resultObject = mainImageAndToc($);
			resultObject.mainImageHtml.should.equal(
				'<figure class="article-image article-image--full" style="width:700px;">' +
					'<div class="article-image__placeholder" style="padding-top:56.25%;">' +
						'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http%3A%2F%2Fcom.ft.imagepublish.prod.s3.amazonaws.com%2F4dd6d624-98cf-11e5-9228-87e603d47bdc?source=next&amp;fit=scale-down&amp;width=700">' +
					'</div>' +
				'</figure>'
			);
			resultObject.bodyHtml.should.equal(
				'<body>' +
					'<p>test test test</p>' +
				'</body>'
			);
		});

		it('should extract a center image that is the first element in the body',() => {
			const $ = cheerio.load(
				'<body>' +
					'<figure class="article-image article-image--center" style="width:600px;">' +
						'<div class="article-image__placeholder" style="padding-top:43%;">' +
							'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http%3A%2F%2Fcom.ft.imagepublish.prod.s3.amazonaws.com%2Faee47340-9307-11e5-bd82-c1fb87bef7af?source=next&amp;fit=scale-down&amp;width=600">' +
						'</div>' +
					'</figure>' +
					'<p>test test test</p>' +
				'</body>'
			);
			const resultObject = mainImageAndToc($);
			resultObject.mainImageHtml.should.equal(
				'<figure class="article-image article-image--center" style="width:600px;">' +
					'<div class="article-image__placeholder" style="padding-top:43%;">' +
						'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http%3A%2F%2Fcom.ft.imagepublish.prod.s3.amazonaws.com%2Faee47340-9307-11e5-bd82-c1fb87bef7af?source=next&amp;fit=scale-down&amp;width=600">' +
					'</div>' +
				'</figure>'
			);
		});

		it('should extract a slideshow that is the first element in the body', () => {
			const $ = cheerio.load(
				'<body>' +
					'<ft-slideshow data-uuid="9f3a2d5e-7dd1-11e5-98fb-5a6d4728f74e"></ft-slideshow>' +
					'<p>test test test</p>' +
				'</body>'
			);
			const resultObject = mainImageAndToc($);
			resultObject.mainImageHtml.should.equal(
				'<ft-slideshow data-uuid="9f3a2d5e-7dd1-11e5-98fb-5a6d4728f74e"></ft-slideshow>'
			);

		});

		it('should not extract an inline image that is the first element in the body', () => {
			const $ = cheerio.load(
				'<body>' +
					'<figure class="article-image article-image--inline" style="width:700px;">' +
						'<div class="article-image__placeholder" style="padding-top:56.25%;">' +
							'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http%3A%2F%2Fcom.ft.imagepublish.prod.s3.amazonaws.com%2F4dd6d624-98cf-11e5-9228-87e603d47bdc?source=next&amp;fit=scale-down&amp;width=700">' +
						'</div>' +
					'</figure>' +
					'<p>test test test</p>' +
				'</body>'
			);
			const resultObject = mainImageAndToc($);
			expect(resultObject.mainImageHtml).to.be.undefined;
			resultObject.bodyHtml.should.equal(
				'<body>' +
					'<figure class="article-image article-image--inline" style="width:700px;">' +
						'<div class="article-image__placeholder" style="padding-top:56.25%;">' +
							'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http%3A%2F%2Fcom.ft.imagepublish.prod.s3.amazonaws.com%2F4dd6d624-98cf-11e5-9228-87e603d47bdc?source=next&amp;fit=scale-down&amp;width=700">' +
						'</div>' +
					'</figure>' +
					'<p>test test test</p>' +
				'</body>'
			);
		});

		it('should not extract a thin image that is the first element in the body', () => {
			const $ = cheerio.load(
				'<body>' +
					'<figure class="article-image article-image--thin" style="width:100px;">' +
						'<div class="article-image__placeholder" style="padding-top:120%;">' +
							'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http%3A%2F%2Fcom.ft.imagepublish.prod.s3.amazonaws.com%2F8d8589a4-94d9-11e5-bd82-c1fb87bef7af?source=next&amp;fit=scale-down&amp;width=100">' +
						'</div>' +
					'</figure>' +
					'<p>test test test</p>' +
				'</body>'
			);
			const resultObject = mainImageAndToc($);
			expect(resultObject.mainImageHtml).to.be.undefined;
			resultObject.bodyHtml.should.equal(
				'<body>' +
					'<figure class="article-image article-image--thin" style="width:100px;">' +
						'<div class="article-image__placeholder" style="padding-top:120%;">' +
							'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http%3A%2F%2Fcom.ft.imagepublish.prod.s3.amazonaws.com%2F8d8589a4-94d9-11e5-bd82-c1fb87bef7af?source=next&amp;fit=scale-down&amp;width=100">' +
						'</div>' +
					'</figure>' +
					'<p>test test test</p>' +
				'</body>'
			);
		});

		it('should not extract an appropriate image that is not the first element in the body', () => {
			const $ = cheerio.load(
				'<body>' +
					'<p>test test test</p>' +
					'<figure class="article-image article-image--full" style="width:700px;">' +
						'<div class="article-image__placeholder" style="padding-top:56.25%;">' +
							'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http%3A%2F%2Fcom.ft.imagepublish.prod.s3.amazonaws.com%2F4dd6d624-98cf-11e5-9228-87e603d47bdc?source=next&amp;fit=scale-down&amp;width=700">' +
						'</div>' +
					'</figure>' +
				'</body>'
			);
			const resultObject = mainImageAndToc($);
			expect(resultObject.mainImageHtml).to.be.undefined;
			resultObject.bodyHtml.should.equal(
				'<body>' +
					'<p>test test test</p>' +
					'<figure class="article-image article-image--full" style="width:700px;">' +
						'<div class="article-image__placeholder" style="padding-top:56.25%;">' +
							'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http%3A%2F%2Fcom.ft.imagepublish.prod.s3.amazonaws.com%2F4dd6d624-98cf-11e5-9228-87e603d47bdc?source=next&amp;fit=scale-down&amp;width=700">' +
						'</div>' +
					'</figure>' +
				'</body>'
			);
		});

	});

	describe('Table of Contents', () => {

		it('should extract the table of contents from the body', () => {
			const $ = cheerio.load(
				'<body>' +
					'<div class="article__toc" data-trackable="table-of-contents">' +
						'<h2 class="article__toc__title">In this article</h2>' +
						'<ol class="article__toc__chapters ng-list-reset">' +
							'<li class="article__toc__chapter"><a class="article__toc__link" href="#crosshead-1" data-trackable="toc">Economics</a></li>' +
							'<li class="article__toc__chapter"><a class="article__toc__link" href="#crosshead-2" data-trackable="toc">Business</a></li>' +
							'<li class="article__toc__chapter"><a class="article__toc__link" href="#crosshead-3" data-trackable="toc">Politics</a></li>' +
						'</ol>' +
					'</div>' +
					'<p>test test test</p>' +
				'</body>'
			);
			const resultObject = mainImageAndToc($);
			resultObject.tocHtml.should.equal(
				'<div class="article__toc" data-trackable="table-of-contents">' +
					'<h2 class="article__toc__title">In this article</h2>' +
					'<ol class="article__toc__chapters ng-list-reset">' +
						'<li class="article__toc__chapter"><a class="article__toc__link" href="#crosshead-1" data-trackable="toc">Economics</a></li>' +
						'<li class="article__toc__chapter"><a class="article__toc__link" href="#crosshead-2" data-trackable="toc">Business</a></li>' +
						'<li class="article__toc__chapter"><a class="article__toc__link" href="#crosshead-3" data-trackable="toc">Politics</a></li>' +
					'</ol>' +
				'</div>'
			);
			resultObject.bodyHtml.should.equal(
				'<body>' +
					'<p>test test test</p>' +
				'</body>'
			);
		});

		it('should extract the table of contents before extracting the main image', () => {
			const $ = cheerio.load(
				'<body>' +
					'<div class="article__toc" data-trackable="table-of-contents">' +
						'<h2 class="article__toc__title">In this article</h2>' +
						'<ol class="article__toc__chapters ng-list-reset">' +
							'<li class="article__toc__chapter"><a class="article__toc__link" href="#crosshead-1" data-trackable="toc">Economics</a></li>' +
							'<li class="article__toc__chapter"><a class="article__toc__link" href="#crosshead-2" data-trackable="toc">Business</a></li>' +
							'<li class="article__toc__chapter"><a class="article__toc__link" href="#crosshead-3" data-trackable="toc">Politics</a></li>' +
						'</ol>' +
					'</div>' +
					'<figure class="article-image article-image--full" style="width:700px;">' +
						'<div class="article-image__placeholder" style="padding-top:56.25%;">' +
							'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http%3A%2F%2Fcom.ft.imagepublish.prod.s3.amazonaws.com%2F4dd6d624-98cf-11e5-9228-87e603d47bdc?source=next&amp;fit=scale-down&amp;width=700">' +
						'</div>' +
					'</figure>' +
					'<p>test test test</p>' +
				'</body>'
			);
			const resultObject = mainImageAndToc($);
			resultObject.mainImageHtml.should.equal(
				'<figure class="article-image article-image--full" style="width:700px;">' +
					'<div class="article-image__placeholder" style="padding-top:56.25%;">' +
						'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http%3A%2F%2Fcom.ft.imagepublish.prod.s3.amazonaws.com%2F4dd6d624-98cf-11e5-9228-87e603d47bdc?source=next&amp;fit=scale-down&amp;width=700">' +
					'</div>' +
				'</figure>'
			);
		});

	});

});
