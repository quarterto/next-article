/* global describe, it */

'use strict';

const transform = require('./transform-helper');
const expect = require('chai').expect;

describe('External images', () => {

	describe('re-formatted as figures', () => {

		it('formats images as figures', () => {
			return transform(
					'<html>' +
						'<body>' +
							'<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>' +
							'<img src="http://my-image/image.jpg" width="800" height="600" alt="Lorem ipsum" />' +
							'<p>Ut enim ad minim <strong>veniam</strong>, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>' +
						'</body>' +
					'</html>'
				)
				.then((transformedXml) => {
					expect(transformedXml).to.equal(
						'<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>' +
						'<figure class="article-image article-image--full" style="width:700px;">' +
							'<div class="article-image__placeholder" style="padding-top:75%;">' +
								'<img alt="Lorem ipsum" src="https://next-geebee.ft.com/image/v1/images/raw/http://my-image/image.jpg?source=next&amp;fit=scale-down&amp;width=700">' +
							'</div>' +
						'</figure>' +
						'<p>Ut enim ad minim <strong>veniam</strong>, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>\n'
					);
				});
		});

		it('moves images out of containing <p> if they\'re the only thing in it', () => {
			return transform(
					'<html>' +
						'<body>' +
							'<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>' +
							'<p>' +
								'<img src="http://my-image/image.jpg" width="800" height="600" alt="Lorem ipsum" />' +
							'</p>' +
							'<p>Ut enim ad minim <strong>veniam</strong>, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>' +
						'</body>' +
					'</html>'
				)
				.then((transformedXml) => {
					expect(transformedXml).to.equal(
						'<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>' +
						'<figure class="article-image article-image--full" style="width:700px;">' +
							'<div class="article-image__placeholder" style="padding-top:75%;">' +
								'<img alt="Lorem ipsum" src="https://next-geebee.ft.com/image/v1/images/raw/http://my-image/image.jpg?source=next&amp;fit=scale-down&amp;width=700">' +
							'</div>' +
						'</figure>' +
						'<p>Ut enim ad minim <strong>veniam</strong>, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>\n'
					);
				});
		});

		it('moves images out of containing <p> if they\'re not the only thing in it', () => {
			return transform(
					'<html>' +
						'<body>' +
							'<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>' +
							'<p>' +
								'<img src="http://my-image/image.jpg" width="800" height="600" />' +
								'Ut enim ad minim <strong>veniam</strong>, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.' +
							'</p>' +
						'</body>' +
					'<html>'
				)
				.then((transformedXml) => {
					expect(transformedXml).to.equal(
						'<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>' +
						'<figure class="article-image article-image--full" style="width:700px;">' +
							'<div class="article-image__placeholder" style="padding-top:75%;">' +
								'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http://my-image/image.jpg?source=next&amp;fit=scale-down&amp;width=700">' +
							'</div>' +
						'</figure>' +
						'<p>Ut enim ad minim <strong>veniam</strong>, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>\n'
					);
				});
		});

		it('moves images out of containing <a>', () => {
			return transform(
					'<html>' +
						'<body>' +
							'<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>' +
							'<p>' +
								'<a href=""><img src="http://my-image/image.jpg" width="800" height="600" alt="Lorem ipsum" /></a> Lorem ipsum <i>doler</i> sit amet.' +
							'</p>' +
							'<p>Ut enim ad minim <strong>veniam</strong>, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>' +
						'</body>' +
					'</html>'
				)
				.then((transformedXml) => {
					expect(transformedXml).to.equal(
						'<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>' +
						'<figure class="article-image article-image--full" style="width:700px;">' +
							'<div class="article-image__placeholder" style="padding-top:75%;">' +
								'<img alt="Lorem ipsum" src="https://next-geebee.ft.com/image/v1/images/raw/http://my-image/image.jpg?source=next&amp;fit=scale-down&amp;width=700">' +
							'</div>' +
						'</figure>' +
						'<p> Lorem ipsum <i>doler</i> sit amet.</p>' +
						'<p>Ut enim ad minim <strong>veniam</strong>, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>\n'
					);
				});
		});

	});

	describe('layout variations', () => {

		it('applies inline variation when source image is small', () => {
			return transform(
					'<html>' +
						'<body>' +
							'<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>' +
							'<p><img src="http://my-image/image.jpg" width="320" height="240" /></p>' +
							'<p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>' +
						'</body>' +
					'</html>\n'
				)
				.then((transformedXml) => {
					expect(transformedXml).to.equal(
						'<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>' +
						'<figure class="article-image article-image--inline" style="width:320px;">' +
							'<div class="article-image__placeholder" style="padding-top:75%;">' +
								'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http://my-image/image.jpg?source=next&amp;fit=scale-down&amp;width=320">' +
							'</div>' +
						'</figure>' +
						'<p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>\n'
					);
				});
		});

		it('applies center variation when source image is neither small nor large', () => {
			return transform(
					'<html>' +
						'<body>' +
							'<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>' +
							'<p><img src="http://my-image/image.jpg" width="640" height="480" /></p>' +
							'<p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>' +
						'</body>' +
					'</html>\n'
				)
				.then((transformedXml) => {
					expect(transformedXml).to.equal(
						'<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>' +
						'<figure class="article-image article-image--center" style="width:640px;">' +
							'<div class="article-image__placeholder" style="padding-top:75%;">' +
								'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http://my-image/image.jpg?source=next&amp;fit=scale-down&amp;width=640">' +
							'</div>' +
						'</figure>' +
						'<p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>\n'
					);
				});
		});

		it('applies full width, maximum size variation when source image is large', () => {
			return transform(
					'<html>' +
						'<body>' +
							'<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>' +
							'<p><img src="http://my-image/image.jpg" width="1600" height="960" /></p>' +
							'<p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>' +
						'</body>' +
					'</html>\n'
				)
				.then((transformedXml) => {
					expect(transformedXml).to.equal(
						'<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>' +
						'<figure class="article-image article-image--full" style="width:700px;">' +
							'<div class="article-image__placeholder" style="padding-top:60%;">' +
								'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http://my-image/image.jpg?source=next&amp;fit=scale-down&amp;width=700">' +
							'</div>' +
						'</figure>' +
						'<p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>\n'
					);
				});
		});

		it('applies inline variation when source image is portrait', () => {
			return transform(
					'<html>' +
						'<body>' +
							'<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>' +
							'<p><img src="http://my-image/image.jpg" width="400" height="800" /></p>' +
							'<p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>' +
						'</body>' +
					'</html>\n'
				)
				.then((transformedXml) => {
					expect(transformedXml).to.equal(
						'<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>' +
						'<figure class="article-image article-image--inline" style="width:350px;">' +
							'<div class="article-image__placeholder" style="padding-top:200%;">' +
								'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http://my-image/image.jpg?source=next&amp;fit=scale-down&amp;width=350">' +
							'</div>' +
						'</figure>' +
						'<p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>\n'
					);
				});
		});

		it('applies full variation when source image has no dimensions', () => {
			return transform(
					'<html>' +
						'<body>' +
							'<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>' +
							'<p><img src="http://my-image/image.jpg" /></p>' +
							'<p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>' +
						'</body>' +
					'</html>\n'
				)
				.then((transformedXml) => {
					expect(transformedXml).to.equal(
						'<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>' +
						'<figure class="article-image article-image--full" style="width:700px;">' +
							'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http://my-image/image.jpg?source=next&amp;fit=scale-down&amp;width=700">' +
						'</figure>' +
						'<p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>\n'
					);
				});
		});

	});

	describe('placeholders and captions', () => {

		it('does not add a placeholder if the image is missing width or height', () => {
			return transform(
					'<html>' +
						'<body>' +
							'<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>' +
							'<p><img src="http://my-image/image.jpg" longdesc="This is a long description" width="585" /></p>' +
							'<p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>' +
						'</body>' +
					'</html>\n'
				)
				.then((transformedXml) => {
					expect(transformedXml).to.equal(
						'<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>' +
						'<figure class="article-image article-image--center" style="width:585px;">' +
							'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http://my-image/image.jpg?source=next&amp;fit=scale-down&amp;width=585">' +
							'<figcaption class="article-image__caption">This is a long description</figcaption>' +
						'</figure>' +
						'<p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>\n'
					);
				});
		});

		it('adds caption when the longdesc attribute is present', () => {
			return transform(
					'<html>' +
						'<body>' +
							'<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>' +
							'<p><img src="http://my-image/image.jpg" longdesc="This is a long description" width="800" height="600" /></p>' +
							'<p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>' +
						'</body>' +
					'</html>\n'
				)
				.then((transformedXml) => {
					expect(transformedXml).to.equal(
						'<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>' +
						'<figure class="article-image article-image--full" style="width:700px;">' +
							'<div class="article-image__placeholder" style="padding-top:75%;">' +
								'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http://my-image/image.jpg?source=next&amp;fit=scale-down&amp;width=700">' +
							'</div>' +
							'<figcaption class="article-image__caption">This is a long description</figcaption>' +
						'</figure>' +
						'<p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>\n'
					);
				});
		});

	});

});
