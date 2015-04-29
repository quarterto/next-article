"use strict";

var argv = require('minimist')(process.argv.slice(2));
var configfile = "./" + argv.t;

// assumes file lives in tests/visual/config/
var page_data = require('./config/' + configfile).testData;
var prod_data = require('./config/' + configfile).productionData;
var page;
var run;
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

for (page in page_data) {
    if (page_data.hasOwnProperty(page)) {

        var testURL = "http://" + process.env.TEST_HOST + ".herokuapp.com";
        var prodHost = prod_data.host;
        var prodSuffix = prod_data.canary;
        var page_name = page_data[page].name;
        var page_path = page_data[page].path;
        var widths = collectWidths(page_data[page]);
        for (var x = 0; x < widths.length; x++) {
            var output = "";
            var width = widths[x];
            var elements = getAllElementsOnWidth(page_data[page], width);

            console.log("\n\nStarting test for.." +
            "\nPage name  : " + page_name +
            "\npath       : " + page_path +
            "\nwidth      : " + width +
            "\nheight     : 1000" +
            "\ntestURL    : " + testURL +
            "\nprodhost   : " + prodHost +
            "\nprodsuffix : " + prodSuffix +
            "\nelements " + JSON.stringify(elements));

            startTestProcess(width, page_name, page_path, elements, testURL, prodHost, prodSuffix);
        }
    }
}

// send the screenshots to AWS


// let github know



function startTestProcess(width, page_name, page_path, elements, testURL, prodHost, prodSuffix) {
    var spawn = require('child_process').spawn;
    run = spawn("casperjs",
        [
            "--width=" + width,
            "--height=1000",
            "--pagename=" + page_name,
            "--path=" + page_path,
            "--elements=" + JSON.stringify(elements),
            "--testurl=" + testURL,
            "--prodhost=" + prodHost,
            "--prodsuffix=" + prodSuffix,
            "test", "tests/visual/elements_test.js"
        ]);

    run.stdout.on('data', function (data) {
        console.log("" + data);
    });

    run.stderr.on('data', function (data) {
        console.log("" + data);
    });

    run.on('close', function (code) {
            console.log('executed with code: ' + code);

            //TODO: output result data to Github (and make sure 'failures' don't stop the build)
        }
    );
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