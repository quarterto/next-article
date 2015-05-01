"use strict";

var fs = require('fs');
var denodeify = require('denodeify');
var exec = denodeify(require('child_process').exec, function(err, stdout, stderr) { return [err, stdout]; });
var argv = require('minimist')(process.argv.slice(2));
var configfile = "./" + argv.t;
require('es6-promise').polyfill();
var deployStatic = require('next-build-tools').deployStatic;

// assumes file lives in tests/visual/config/
var page_data = require('./config/' + configfile).testData;
var prod_data = require('./config/' + configfile).productionData;
var page;
var screenshots;
var failures;
var commit = process.env.GIT_HASH;
var date = new Date();
var current_day = getDayName(date);
var timeString = date.getUTCHours() + "h"
    + date.getUTCMinutes() + "m"
    + date.getUTCMilliseconds() + "ms";

var aws_shot_dest = "image_diffs/" + prod_data.app_name + "/" + current_day + "/" + timeString + "__" + commit + "/screenshots/";
var aws_fail_dest = "image_diffs/" + prod_data.app_name + "/" + current_day + "/" + timeString + "__" + commit + "/failures/";

var screnshot_send_cmd = "nbt deploy-static ./tests/visual/screenshots/*.png --destination " + aws_shot_dest + " --strip 3";
var failure_send_cmd = "nbt deploy-static ./tests/visual/failure/*.png --destination " + aws_fail_dest + " --strip 3";

console.log("Screenshot destination: " + aws_shot_dest);
console.log("Failures destination: " + aws_fail_dest);
console.log("Screenshot send command: " + screnshot_send_cmd);
console.log("Failure send command: " + failure_send_cmd);

console.log("image diffs section running");


startImageDiffs()
    .then(function (result) {
        console.log("Finished startImageDiffs");
        console.log("Result: " + result);
        console.log("Starting uploadImages");


        if (fs.existsSync("tests/visual/screenshots")) {

            screenshots = fs.readdirSync("tests/visual/screenshots");
            for (var x = 0; x < screenshots.length; x++) {
                screenshots[x] = "tests/visual/screenshots/" + screenshots[x];
            }
            console.log(screenshots);

            deployStatic({
                files: screenshots,
                destination: aws_shot_dest,
                region: 'eu-west-1',
                bucket: 'ft-next-qa',
                strip: 3
            });
        } else {
            console.log("No screenshots here");
        }


        if (fs.existsSync("tests/visual/failures")) {
            failures = fs.readdirSync("tests/visual/failures");
            for (var y = 0; y < failures.length; y++) {
                failures[y] = "tests/visual/failures/" + failures[y];
            }

            console.log(failures);

            deployStatic({
                files: failures,
                destination: aws_fail_dest,
                region: 'eu-west-1',
                bucket: 'ft-next-qa',
                strip: 3
            });
        } else {
            console.log("No failures found");
        }


    })
    .catch(function (err) {
        console.log("there was an error");
        console.log(err.stack);
    });




function startImageDiffs() {
    var imageDiffPromises = [];

    for (page in page_data) {
        if (page_data.hasOwnProperty(page)) {

            var testURL = "http://" + process.env.TEST_HOST + ".herokuapp.com";
            var prodHost = prod_data.host;
            var prodSuffix = prod_data.canary;
            var page_name = page_data[page].name;
            var page_path = page_data[page].path;
            var widths = collectWidths(page_data[page]);
            for (var x = 0; x < widths.length; x++) {
                var width = widths[x];
                var elements = getAllElementsOnWidth(page_data[page], width);

                var test = "\nPage name  : " + page_name +
                    "\npath       : " + page_path +
                    "\nwidth      : " + width +
                    "\nheight     : 1000" +
                    "\ntestURL    : " + testURL +
                    "\nprodhost   : " + prodHost +
                    "\nprodsuffix : " + prodSuffix +
                    "\nelements " + JSON.stringify(elements);

                console.log("Starting test for " + test);
                imageDiffPromises.push(
                    startTestProcess(width, page_name, page_path, elements, testURL, prodHost, prodSuffix)
                );
            }
        }
    }
    return Promise.all(imageDiffPromises);
}


// let github know

function startTestProcess(width, page_name, page_path, elements, testURL, prodHost, prodSuffix) {
    var args = [
        "--width='" + width + "'",
        "--height=1000",
        "--pagename='" + page_name + "'",
        "--path='" + page_path + "'",
        "--elements='" + JSON.stringify(elements) + "'",
        "--testurl='" + testURL + "'",
        "--prodhost='" + prodHost + "'",
        "--prodsuffix='" + prodSuffix + "'",
        "test",
        "tests/visual/elements_test.js"
    ].join(' ');
    return exec("casperjs " + args);
}


function getAllElementsOnWidth(json, width) {
    var elementObject = {};
    var item;
    for (item in json.elements) {
        if(json.elements.hasOwnProperty(item)) {
            var element = json.elements[item];
            var widths = element.widths;
            if (widths.indexOf(width) === -1) {
            } else {
                elementObject[element.name] = element.css;
            }
        }
    }
    return elementObject;
}

function collectWidths(json) {
    var compiledWidths = [];
    var item;
    for (item in json.elements) {
        if(json.elements.hasOwnProperty(item)) {
            var widths = json.elements[item].widths;
            for (var x = 0; x < widths.length; x++) {
                if (compiledWidths.indexOf(widths[x]) === -1) {
                    compiledWidths.push(widths[x]);
                }
            }
        }
    }
    return compiledWidths;
}

function getDayName(date) {
    var weekday = new Array(7);
    weekday[0]=  "Sunday";
    weekday[1] = "Monday";
    weekday[2] = "Tuesday";
    weekday[3] = "Wednesday";
    weekday[4] = "Thursday";
    weekday[5] = "Friday";
    weekday[6] = "Saturday";
    return weekday[date.getDay()].toLowerCase();
}