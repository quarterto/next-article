/*global describe, it*/
'use strict';

require('chai').should();
var twitterCard = require('../../../server/utils/twitter-card').summary;

describe('Twitter card', function () {

	var image = {
		binaryUrl: 'http://foo.png'
	};

	var v1 = {
		item: {
			editorial: {
				standFirst: 'vertical but yet are broadly'
			}
		}
	};

	var v2 = {
		title: 'Monitise issues fresh',
		id: 'http://www.ft.com/thing/0786d5a8-23b2-11e5-bd83-71cb60e8f08c'
	};

	it('should return an Open Graph object', function () {
		twitterCard(v2, v1, image).should.deep.equal(
		    {
				"description": "vertical but yet are broadly",
				"image": "http://foo.png",
				"title": "Monitise issues fresh",
				"card": "summary_large_image"
			}	
		);
	});

});
