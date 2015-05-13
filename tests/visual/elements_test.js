/*global casper */
"use strict";

var fs = require('fs');
var phantom_path = fs.absolute(fs.workingDirectory + '/tests/visual/phantomcss.js');
var phantomcss = require(phantom_path);
var compares = [];
var elements = JSON.parse(casper.cli.get('elements'));
var pageName = casper.cli.get('pagename');
var path = casper.cli.get('path');
var wait_for = casper.cli.get('waitfor');
var width = casper.cli.get('width') || 800;
var height = casper.cli.get('height') || 1000;
var testURL = casper.cli.get('testurl') + "/" + path;
var baseURL = casper.cli.get('prodhost') + "/" + path + casper.cli.get('prodsuffix');

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
        },
        onComplete: function completeCallback() {
            console.log("Finished a test!");
        }

    });

	// set up casper a bit
	casper.on("page.error", function(msg, trace) {
		this.echo("Error: " + msg, "ERROR");
	});

	casper.options.pageSettings.javascriptEnabled = true;


    // open first url
    casper.start(baseURL);

    casper.viewport(width,height);

	casper.then(function(){
		console.log(baseURL);
		waitForJStoLoad();
		waitUntilLastElementVisible();
	});

    phantomcss.getElementShots(pageName,elements,'base',width,height);


    // open second url
    casper.thenOpen(testURL);

	casper.then(function(){
		console.log(testURL);
		waitForJStoLoad();
		waitUntilLastElementVisible();
	});

	phantomcss.getElementShots(pageName,elements,'test',width,height);


    // make comparisons
    casper.then(compareMatched);

    casper.run(function () {
        console.log('\nFinished testing');
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

	function waitForJStoLoad(){
		casper.waitFor(function(){
			var js = (casper.evaluate(function(){
				return document.querySelector('html').className;
			}));
			return js.indexOf('success') !== -1;
		},function then(){
		},function onTimeout(){
			console.log("Timed Out loading js: was there a js failure?");
		},5000);
	}

	function waitUntilLastElementVisible(){
		casper.waitUntilVisible(wait_for, function(){
		},function(){
			console.log("Timed out finding: " + wait_for);
		},20000);

	}

});