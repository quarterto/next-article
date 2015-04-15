'use strict';

var nock = require('nock');
var request = require('request');
var expect = require('chai').expect;

var articleV1Elastic = require('../fixtures/capi-v1-elastic-search.json');
var articleV2Elastic = require('../fixtures/capi-v2-elastic.json');
var fastFtArticleV2Elastic = require('../fixtures/capi-v2-fastft-elastic.json');
var fs = require('fs');
var renderBlogPost = fs.readFileSync(__dirname + '/../fixtures/render-blog.html', 'UTF-8');
var renderFastFt = fs.readFileSync(__dirname + '/../fixtures/render-fastft.html', 'UTF-8');
var PORT = process.env.PORT || 3001;
var host = 'http://localhost:' + PORT;

module.exports = {
	host: host,
	servesGoodHTML: function(url, done) {
		request(host + url, function(error, res, body) {
			expect(res.headers['content-type']).to.match(/text\/html/);
			expect(res.statusCode).to.equal(200);
			done();
		});
	},
	mockMethode: function() {
		nock('https://ft-elastic-search.com')
			.get('/v1_api_v2/item/02cad03a-844f-11e4-bae9-00144feabdc0')
			.reply(200, articleV1Elastic);
		nock('https://ft-elastic-search.com')
			.get('/v1_api_v2/item/b002e5ee-3096-3f51-9925-32b157740c98')
			.reply(404);
		nock('https://ft-elastic-search.com')
			.post('/v2_api_v2/item/_mget', { ids: ["02cad03a-844f-11e4-bae9-00144feabdc0"] })
			.reply(200, articleV2Elastic);
		nock('https://ft-elastic-search.com')
			.post('/v2_api_v2/item/_mget', { ids: ["b002e5ee-3096-3f51-9925-32b157740c98"] })
			.reply(200, fastFtArticleV2Elastic);
		nock('http://www.ft.com')
			.get('/cms/s/02cad03a-844f-11e4-bae9-00144feabdc0.html')
			.reply(404, renderBlogPost)
			.get('/cms/s/b002e5ee-3096-3f51-9925-32b157740c98.html')
			.reply(404, renderFastFt);
	}
};
