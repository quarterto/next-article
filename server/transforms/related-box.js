'use strict';

const $ = require('cheerio');
const articlePodMapping = require('../mappings/article-pod-mapping-v3');
const api = require('next-ft-api-client');
const fetchres = require('fetchres');

function extractUuid ($relatedArticles) {
	return $relatedArticles.map(function () {
			return $(this).attr('uuid');
	}).get();
}

// TO DO move this into a helper - used in multiple places
function getArticle (uuids) {
	return api.content({
		uuid: uuids,
		index: 'v3_api_v2'
	})
		// Some things aren't in CAPI v3 (e.g. Syndicated content)
		.catch(function(error) {
			if (fetchres.originatedError(error)) {
				return;
			} else {
				throw error;
			}
		});
}

// TO DO convert these to templates??
function createHtml (article) {
	return [`${article.mainImage ? articleMainImage(article) : ''}`,
		`<div class="related-box__headline"><a class="related-box__headline--link" data-trackable="link-headline" href="${article.url}">${article.title}</a></div>`,
		`<div class="related-box__content"><p>${article.subheading}</p></div><div>`,
		`<a href="${article.url}" class="related-box__link" data-trackable="link-read-more">Read more</a></div>`
	].join('');
}

function articleMainImage (article) {
	return [`<div class="related-box__image"><a class="related-box__image--link" data-trackable="link-image" href="${article.url}">`,
		`<div class="article-image__placeholder" style="padding-top:${article.mainImage.paddingTop}">`,
		`<img alt="${article.mainImage.alt}" src="https://next-geebee.ft.com/image/v1/images/raw/${article.mainImage.url}?source=next&amp;fit=scale-down&amp;width=300"></div></a></div>`
	].join('');

}

module.exports = function($body) {
	let $relatedArticles = $body('aside.to-fetch.related-box__article');
	const uuids = extractUuid($relatedArticles);
	return getArticle(uuids)
		.then(articles => [].concat(articles).map(article => articlePodMapping(article)))
		.then(mappedArticles => {
			let articleHtmlArray = [];
			mappedArticles.forEach(article => {
				if (article.mainImage) {
					article.mainImage.paddingTop = 100 / Math.max(300, article.mainImage.width) * article.mainImage.height;
					article.mainImage.alt = '';
				}
				articleHtmlArray.push(createHtml(article));
			});
			articleHtmlArray.forEach((articleHtml, i) => {
				$relatedArticles.eq(i).children().first().append($(articleHtml));
			})
			return $body;
		});
};
