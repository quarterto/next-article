/*global describe, it*/
"use strict";

require('chai').should();
const cheerio = require('cheerio');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

const stubs = {content: null};

const subject = proxyquire('../../../server/transforms/related-box', {
	'next-ft-api-client': stubs,
	'../mappings/article-pod-mapping-v3': (article) => article
});

const relatedArticleAsideFirst = '<aside data-trackable="related-article" role="complementary" class="related-box related-box__article to-fetch" uuid="765af108-8c7b-11e5-a549-b89a1dfede9b"><div class="related-box__wrapper"></div></aside>';
const relatedArticleAsideSecond = '<aside data-trackable="related-article" role="complementary" class="related-box related-box__article to-fetch" uuid="765af108-8c7b-11e5-a549-0rand0mchar5"><div class="related-box__wrapper"></div></aside>';

const articleFirst = {
	title: "Belgian PM threatens to close ‘certain radical mosques’",
	subheading: "Security services home in on deprived Molenbeek neighbourhood of Brussels",
	url: "/content/765af108-8c7b-11e5-a549-b89a1dfede9b",
	mainImage:
		{alt: "Police officers man a cordon as an operation takes place in the Molenbeek district of Brussels on November 16, 2015. AFP PHOTO / JOHN THYSJOHN THYS/AFP/Getty Images",
		url: "http://com.ft.imagepublish.prod.s3.amazonaws.com/00933f30-8c52-11e5-a549-b89a1dfede9b",
		width: 2048,
		height: 1152}
};

const articleSecond = {
	title: "This is the headline",
	subheading: "Here lies the subheading or standfirst",
	url: "/content/765af108-8c7b-11e5-a549-0rand0mchar5",
	mainImage:
		{alt: "This will be blanked",
		url: "http://com.ft.imagepublish.prod.s3.amazonaws.com/00933f30-8c52-11e5-a549-0rand0mchar5",
		width: 230,
		height: 129}
};

const articleThird = {
	title: "Belgian PM threatens to close ‘certain radical mosques’",
	subheading: "Security services home in on deprived Molenbeek neighbourhood of Brussels",
	url: "/content/765af108-8c7b-11e5-a549-b89a1dfede9b",
};

const expectedHtml1 = [
	'<body><aside data-trackable="related-article" role="complementary" class="related-box related-box__article to-fetch" uuid="765af108-8c7b-11e5-a549-b89a1dfede9b">',
	'<div class="related-box__wrapper">',
	'<div class="related-box__image"><a class="related-box__image--link" data-trackable="link-image" href="/content/765af108-8c7b-11e5-a549-b89a1dfede9b">',
	'<div class="article-image__placeholder" style="padding-top:56.25">',
	'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http://com.ft.imagepublish.prod.s3.amazonaws.com/00933f30-8c52-11e5-a549-b89a1dfede9b?source=next&amp;fit=scale-down&amp;width=300">',
	'</div></a></div>',
	'<div class="related-box__headline"><a class="related-box__headline--link" data-trackable="link-headline" href="/content/765af108-8c7b-11e5-a549-b89a1dfede9b">Belgian PM threatens to close &#x2018;certain radical mosques&#x2019;</a></div>',
	'<div class="related-box__content"><p>Security services home in on deprived Molenbeek neighbourhood of Brussels</p></div>',
	'<div><a href="/content/765af108-8c7b-11e5-a549-b89a1dfede9b" class="related-box__link" data-trackable="link-read-more">Read more</a></div>',
	'</div></aside>'
].join('');

const expectedHtml2 = [
	'<aside data-trackable="related-article" role="complementary" class="related-box related-box__article to-fetch" uuid="765af108-8c7b-11e5-a549-0rand0mchar5">',
	'<div class="related-box__wrapper">',
	'<div class="related-box__image"><a class="related-box__image--link" data-trackable="link-image" href="/content/765af108-8c7b-11e5-a549-0rand0mchar5">',
	'<div class="article-image__placeholder" style="padding-top:43">',
	'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http://com.ft.imagepublish.prod.s3.amazonaws.com/00933f30-8c52-11e5-a549-0rand0mchar5?source=next&amp;fit=scale-down&amp;width=300">',
	'</div></a></div>',
	'<div class="related-box__headline"><a class="related-box__headline--link" data-trackable="link-headline" href="/content/765af108-8c7b-11e5-a549-0rand0mchar5">This is the headline</a></div>',
	'<div class="related-box__content"><p>Here lies the subheading or standfirst</p></div>',
	'<div><a href="/content/765af108-8c7b-11e5-a549-0rand0mchar5" class="related-box__link" data-trackable="link-read-more">Read more</a></div>',
	'</div></aside></body>'
].join('');

const expectedHtml3 = [
	'<body><aside data-trackable="related-article" role="complementary" class="related-box related-box__article to-fetch" uuid="765af108-8c7b-11e5-a549-b89a1dfede9b">',
	'<div class="related-box__wrapper">',
	'<div class="related-box__headline"><a class="related-box__headline--link" data-trackable="link-headline" href="/content/765af108-8c7b-11e5-a549-b89a1dfede9b">Belgian PM threatens to close &#x2018;certain radical mosques&#x2019;</a></div>',
	'<div class="related-box__content"><p>Security services home in on deprived Molenbeek neighbourhood of Brussels</p></div>',
	'<div><a href="/content/765af108-8c7b-11e5-a549-b89a1dfede9b" class="related-box__link" data-trackable="link-read-more">Read more</a></div>',
	'</div></aside></body>'
].join('');

describe('Related Box Transform', function() {

	let results;

	describe('Single article related-box', function() {

		before(function() {

			const $ = cheerio.load(`<body>${relatedArticleAsideFirst}</body>`);

			stubs.content = sinon.stub().returns(
				Promise.resolve(articleFirst)
			);

			return subject($)
				.then(result => results = result.html());
		});

		it('should return the required article', function() {
			results.should.equal(expectedHtml1.concat(['</body>']));
		});

	});

	describe('Mulitple article related-box', function() {

		before(function() {
			const $ = cheerio.load(`<body>${relatedArticleAsideFirst}${relatedArticleAsideSecond}</body>`);

			stubs.content = sinon.stub().returns(
				Promise.resolve([articleFirst, articleSecond])
			);

			return subject($)
				.then(result => results = result.html());
		});

		it('should return the required articles', function() {
			results.should.equal(expectedHtml1.concat(expectedHtml2));
		});

	});

	describe('Related box for article without an image', () => {
		before(function() {
			const $ = cheerio.load(`<body>${relatedArticleAsideFirst}</body>`);

			stubs.content = sinon.stub().returns(
				Promise.resolve([articleThird])
			);

			return subject($)
				.then(result => results = result.html());
		});

		it('should return the required structure without any image', () => {
			results.should.equal(expectedHtml3);
		});
	});

});
