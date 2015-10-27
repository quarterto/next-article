/*global describe, it*/
'use strict';

require('chai').should();
var openGraph = require('../../../server/utils/open-graph');

describe('Open graph', function () {

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

	var v1HannahKuchler = {
		item: {
			metadata: {
				authors: [
					{
						term: {
							id: 'Q0ItMDAwMDc5Ng==-QXV0aG9ycw=='
						}
					}
				]
			},
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
		openGraph(v2, v1, image).should.deep.equal(
				{
				"description": "vertical but yet are broadly",
				"image": "http://foo.png",
				"title": "Monitise issues fresh",
				"url": "https://next.ft.com/0786d5a8-23b2-11e5-bd83-71cb60e8f08c"
			}
		);
	});

	it('should return the Facebook URL for Hannah Kuchler', function () {
		openGraph(v2, v1HannahKuchler, image).should.deep.equal(
				{
				"description": "vertical but yet are broadly",
				"image": "http://foo.png",
				"title": "Monitise issues fresh",
				"facebookAuthor": "https://www.facebook.com/HKuchler",
				"url": "https://next.ft.com/0786d5a8-23b2-11e5-bd83-71cb60e8f08c"
			}
		);
	});


});
