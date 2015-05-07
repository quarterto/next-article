/*global casper */
"use strict";

var fs = require('fs');
var path = fs.absolute(fs.workingDirectory + '/tests/visual/phantomcss.js');
var phantomcss = require(path);
var compares = [];
var elements = JSON.parse(casper.cli.get('elements'));
var pageName = casper.cli.get('pagename');
var path = casper.cli.get('path');
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

    // open first url
    casper.start(baseURL);

    casper.viewport(width,height);

    phantomcss.getElementShots(pageName,elements,'base',width,height);


    // open second url
    casper.thenOpen(testURL);

    phantomcss.getElementShots(pageName,elements,'test',width,height);


    // make comparisons
    casper.then(compareMatched);

    casper.run(function () {
        console.log('\nFinished testing');
		casper.exit();
        //phantomcss.getExitStatus();
        //casper.test.done(0);
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