/*global casper */
"use strict";

var isFile = require('fs').isFile;
var phantomcss = require('phantomcss');
var compares = [];
var pageName = casper.cli.get('pagename');
var test = require('./config').pageName;
var height = 1000;
var testHost = "http://" + process.env.TEST_HOST + ".herokuapp.com" + test.path;
var baseHost = "http://ft-next-article.herokuapp.com" + test.path;

function getElementShots(pageName, elements, env, width, height) {
	console.log('screenshotting ' + env);
	Object.keys(elements).forEach(function(elementName) {
		var fileName = pageName + "_" + elementName + "_" + width + "_" + height + "_" + env;
		phantomcss.screenshot(elements[elementName], 2000, undefined, fileName);
		if (env === 'base') {
			compares.push("tests/visual/screenshots/successes/" + fileName + ".png");
		}
	});
}

var browserOptions = {
	method: 'get',
	headers: {
		'Cookie': 'next-flags=javascript:off; FT_SITE=NEXT'
	}
};

casper.test.begin('Next visual regression tests', function(test) {

	// phantom config
	phantomcss.init({
		timeout: 1000,
		libraryRoot: './node_modules/phantomcss',
		screenshotRoot: './tests/visual/screenshots/successes',
		failedComparisonsRoot: './tests/visual/screenshots/failures',
		addLabelToFailedImage: false,
		fileNameGetter: function(root, fileName) {
			var file = root + '/' + fileName;
			if (isFile(file + '.png')) {
				return file + '.diff.png';
			}
			return file + '.png';
		}
	});

	// set up casper a bit
	casper.on("page.error", function(msg, trace) {
		this.echo("Error: " + msg, "ERROR");
	});

	casper.on("page.consoleMessage",function(msg) {
		this.echo("Message: " + msg);
	});

	casper.options.pageSettings.javascriptEnabled = true;
	casper.userAgent('Mozilla/4.0(compatible; MSIE 7.0b; Windows NT 6.0)');

	// open first url
	casper.start();

	casper.thenOpen(baseHost, browserOptions, function() {
		test.widths.forEach(function(width) {
			casper.viewport(width, height);
			getElementShots(pageName, test.elements, 'base', width, height);
		});
	});
	casper.thenOpen(testHost, browserOptions, function() {
		test.widths.forEach(function(width) {
			casper.viewport(width, height);
			getElementShots(pageName, test.elements, 'test', width, height);
		});
	});
	casper.then(function() {
		console.log("compares: ", compares);
		compares.forEach(function(compare) {
			phantomcss.compareFiles(compare, compare.replace('_base', '_test'));
		});
	});
	casper.run(function() {
		casper.exit();
	});
});
