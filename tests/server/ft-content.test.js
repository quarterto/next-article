/*global it*/
"use strict";
var cheerio = require('cheerio');
var expect = require('chai').expect;
var ftContentTransform = require('../../server/transforms/ft-content');

it('should turn capi v2 ft-content links into a tags', function() {
	var $ = cheerio.load('<ft-content title="Wolfgang Münchau: Draghi’s QE is an imperfect compromise " type="http://www.ft.com/ontology/content/Article" url="http://api.ft.com/content/f203bf76-a241-11e4-bbb8-00144feab7de">aunched a programme of quantitative easing to </ft-content>');
	$('ft-content').replaceWith(ftContentTransform);
	expect($.html()).to.equal('<a href="/f203bf76-a241-11e4-bbb8-00144feab7de" data-trackable="link">aunched a programme of quantitative easing to </a>');
});

it('should turn capi v2 ft-content image into img tags', function() {
	var $ = cheerio.load('<p><ft-content data-embedded="true" type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/4e2487ee-422b-11e4-39b2-97bbf262bf2b"></ft-content>Another left-aligned landscape image here.</p>');
	$('ft-content').replaceWith(ftContentTransform);
	expect($.html()).to.equal('<p><img class=\"article__inline-image ng-inline-element ng-pull-out\" src=\"//image.webservices.ft.com/v1/images/raw/http%3A%2F%2Fft-next-grumman-v002.herokuapp.com%2Fembedded-components%2Fimage%2F4e2487ee-422b-11e4-39b2-97bbf262bf2b?width=300&amp;source=next&amp;fit=scale-down\" srcset=\"//image.webservices.ft.com/v1/images/raw/http%3A%2F%2Fft-next-grumman-v002.herokuapp.com%2Fembedded-components%2Fimage%2F4e2487ee-422b-11e4-39b2-97bbf262bf2b?width=300&amp;source=next&amp;fit=scale-down 1x, //image.webservices.ft.com/v1/images/raw/http%3A%2F%2Fft-next-grumman-v002.herokuapp.com%2Fembedded-components%2Fimage%2F4e2487ee-422b-11e4-39b2-97bbf262bf2b?width=600&amp;source=next&amp;fit=scale-down 2x\">Another left-aligned landscape image here.</p>');
});

it('should turn capi v2 ft-content unrecognised content types into nothing', function() {
	var $ = cheerio.load('<p><ft-content data-embedded="true" type="http://www.ft.com/ontology/content/Badger" url="http://api.ft.com/content/4e2487ee-422b-11e4-39b2-97bbf262bf2b"></ft-content>Another left-aligned landscape image here.</p>');
	$('ft-content').replaceWith(ftContentTransform);
	expect($.html()).to.equal('<p>Another left-aligned landscape image here.</p>');
});

it('should turn capi v2 ft-content links with pretty content into pretty links', function() {
	var $ = cheerio.load('<ft-content title="Wolfgang Münchau: Draghi’s QE is an imperfect compromise " type="http://www.ft.com/ontology/content/Article" url="http://api.ft.com/content/f203bf76-a241-11e4-bbb8-00144feab7de">aunched a programme of <b>quantitative</b> easing to </ft-content>');
	$('ft-content').replaceWith(ftContentTransform);
	expect($.html()).to.equal('<a href="/f203bf76-a241-11e4-bbb8-00144feab7de" data-trackable="link">aunched a programme of <b>quantitative</b> easing to </a>');
});

it('should promote main images to main images', function() {
	var $ = cheerio.load('<body><ft-content data-embedded="true" type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/12395166-c6cd-11e4-3f5b-978e959e1c97"></ft-content><p>Tim says “aluminum”, Jony says “aluminium”.</p></body>');
	$('ft-content').replaceWith(ftContentTransform);
	expect($.html()).to.equal('<body><img class=\"article__main-image\" src=\"//image.webservices.ft.com/v1/images/raw/http%3A%2F%2Fft-next-grumman-v002.herokuapp.com%2Fembedded-components%2Fimage%2F12395166-c6cd-11e4-3f5b-978e959e1c97?width=700&amp;source=next&amp;fit=scale-down\" srcset=\"//image.webservices.ft.com/v1/images/raw/http%3A%2F%2Fft-next-grumman-v002.herokuapp.com%2Fembedded-components%2Fimage%2F12395166-c6cd-11e4-3f5b-978e959e1c97?width=700&amp;source=next&amp;fit=scale-down 1x, //image.webservices.ft.com/v1/images/raw/http%3A%2F%2Fft-next-grumman-v002.herokuapp.com%2Fembedded-components%2Fimage%2F12395166-c6cd-11e4-3f5b-978e959e1c97?width=1400&amp;source=next&amp;fit=scale-down 2x\"><p>Tim says &#x201C;aluminum&#x201D;, Jony says &#x201C;aluminium&#x201D;.</p></body>');
});

it('should not promote not main images to main images', function() {
	var $ = cheerio.load('<body><p>First paragraph</p><ft-content data-embedded="true" type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/12395166-c6cd-11e4-3f5b-978e959e1c97"></ft-content><p>Tim says “aluminum”, Jony says “aluminium”.</p></body>');
	$('ft-content').replaceWith(ftContentTransform);
	expect($.html()).to.equal('<body><p>First paragraph</p><img class=\"article__inline-image ng-inline-element ng-pull-out\" src=\"//image.webservices.ft.com/v1/images/raw/http%3A%2F%2Fft-next-grumman-v002.herokuapp.com%2Fembedded-components%2Fimage%2F12395166-c6cd-11e4-3f5b-978e959e1c97?width=300&amp;source=next&amp;fit=scale-down\" srcset=\"//image.webservices.ft.com/v1/images/raw/http%3A%2F%2Fft-next-grumman-v002.herokuapp.com%2Fembedded-components%2Fimage%2F12395166-c6cd-11e4-3f5b-978e959e1c97?width=300&amp;source=next&amp;fit=scale-down 1x, //image.webservices.ft.com/v1/images/raw/http%3A%2F%2Fft-next-grumman-v002.herokuapp.com%2Fembedded-components%2Fimage%2F12395166-c6cd-11e4-3f5b-978e959e1c97?width=600&amp;source=next&amp;fit=scale-down 2x\"><p>Tim says &#x201C;aluminum&#x201D;, Jony says &#x201C;aluminium&#x201D;.</p></body>');
});
