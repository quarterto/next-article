/*global casper */
"use strict";

var fs = require('fs');
var phantom_path = fs.absolute(fs.workingDirectory + '/tests/visual/phantomcss.js');
var phantomcss = require(phantom_path);
var compares = [];
var elements = JSON.parse(casper.cli.get('elements'));
var pageName = casper.cli.get('pagename');
var path = casper.cli.get('path');
var width = casper.cli.get('width') || 800;
var height = casper.cli.get('height') || 1000;
var testURL = casper.cli.get('testurl') + "/" + path;
var baseURL = casper.cli.get('prodhost') + "/" + path;

console.log("TESTURL: " + testURL);
console.log("BaseURL: " + baseURL);

casper.test.begin('Next visual regression tests', function (test) {

	// phantom config
	phantomcss.init({
		rebase: casper.cli.get("rebase"),
		casper: casper,
		timeout: 1000,
		libraryRoot: fs.absolute(fs.workingDirectory + ''),
		screenshotRoot: fs.absolute(fs.workingDirectory + '/tests/visual/screenshots'),
		failedComparisonsRoot: fs.absolute(fs.workingDirectory + '/tests/visual/failures'),
		addLabelToFailedImage: false,
		fileNameGetter: function (root, filename) {
			var name = root + '/' + filename;
			if (fs.isFile(name +'.png')) {
				name += '.diff.png';
			} else {
				name += '.png';
			}
			compares.push(name);
			return name;
		}
	});

	// set up casper a bit
	casper.on("page.error", function(msg, trace) {
		this.echo("Error: " + msg, "ERROR");
	});

	casper.on("page.consoleMessage",function(msg){
		this.echo("Message: " + msg);
	});

	casper.options.pageSettings.javascriptEnabled = true;
	casper.userAgent('Mozilla/4.0(compatible; MSIE 7.0b; Windows NT 6.0)');

	// open first url
	casper.start().then(function(){
		this.open(baseURL,{
			method: 'get',
			headers: {
				'Cookie': 'next-flags=javascript:off'
			}
		});
	});

	casper.viewport(width,height);

	casper.then(function(){
		console.log(baseURL);
	});

	phantomcss.getElementShots(pageName,elements,'base',width,height);


	// open second url
	casper.thenOpen(testURL,{
		method: 'get',
		headers: {
			'X-flags': 'javascript' + ':'.toLowerCase() + 'off'
		}
	});

	casper.then(function(){
		console.log(testURL);
	});

	phantomcss.getElementShots(pageName,elements,'test',width,height);


	// make comparisons
	casper.then(compareMatched);

	casper.run(function () {
		casper.exit();
	});


	function compareMatched(){
		var bases = [];
		for(var x = 0; x < compares.length ; x++){
			if(compares[x].indexOf('_' + 'base') !== -1){
				bases.push(compares[x]);
			}
		}
		for(x = 0; x < bases.length ; x ++){
			var base = bases[x];
			var test = base.replace('_' + 'base','_' + 'test');
			phantomcss.compareFiles(base,test);
		}
	}

});
