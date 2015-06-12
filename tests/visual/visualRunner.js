"use strict";

require('es6-promise').polyfill();

var normalizeName = require('next-build-tools/lib/normalize-name');
var exec = require('next-build-tools/lib/exec');
var packageJson = require('../../package.json');

var fs = require('fs');
var denodeify = require('denodeify');
var writeFile = denodeify(fs.writeFile);
var deployStatic = require('next-build-tools').deployStatic;
var GitHubApi = require('github');
var github = new GitHubApi({ version: "3.0.0" });
github.authenticate({ type: "oauth", token: process.env.GITHUB_OAUTH });
var createComment = denodeify(github.issues.createComment);

// env variables
var commit = process.env.GIT_HASH;
var page_data = require('./config/page_setup');

var screenshots;
var failures;
var date = new Date();
var dateString = date.getUTCFullYear() + "y"
	+ date.getUTCMonth() + "m"
	+ date.getUTCDate() + "d"
	+ date.getUTCHours() + "h"
	+ date.getUTCMinutes() + "m";

var aws_shot_dest = "image_diffs/" + normalizeName(packageJson.name, { version: false }) + "/" + dateString + "__" + commit + "/screenshots/";
var aws_fail_dest = "image_diffs/" + normalizeName(packageJson.name, { version: false }) + "/" + dateString + "__" + commit + "/failures/";
var aws_shots_index = "https://s3-eu-west-1.amazonaws.com/ft-next-qa/" + aws_shot_dest + "index.html";
var aws_fails_index = "https://s3-eu-west-1.amazonaws.com/ft-next-qa/" + aws_fail_dest + "index.html";

console.log("Running image diff tests");

var imageDiffPromises = [];

Object.keys(page_data).forEach(function(page) {
	var testHost = "http://" + process.env.TEST_HOST + ".herokuapp.com";
	var prodHost = "http://next.ft.com";
	var page_name = page_data[page].name;
	var page_path = page_data[page].path;
	var widths = collectWidths(page_data[page]);
	widths.forEach(function(width) {
		var height = 1000;
		var elements = getAllElementsOnWidth(page_data[page], width);
		var test = "\nPage name  : " + page_name +
			"\npath       : " + page_path +
			"\ndimensions : " + width + "x" + height +
			"\ntestHost    : " + testHost +
			"\nprodhost   : " + prodHost +
			"\nelements " + JSON.stringify(elements);

		console.log("\nStarting test for " + test);

		imageDiffPromises.push(
			exec("casperjs " + [
				"--width=" + width,
				"--height=" + height,
				"--pagename='" + page_name + "'",
				"--path='" + page_path + "'",
				"--elements='" + JSON.stringify(elements) + "'",
				"--testhost='" + testHost + "'",
				"--prodhost='" + prodHost + "'",
				"test",
				"tests/visual/elements_test.js"
			].join(' '))
		);
	});
});

Promise.all(imageDiffPromises)
	.then(function(result) {
		var promises = [];
		console.log("\n\nCasperJS output: \n\n" + result);

		if (fs.existsSync("tests/visual/screenshots")) {

			// find all screenshots and build an html page to display them
			screenshots = fs.readdirSync("tests/visual/screenshots");
			var screenshotspage = buildIndexPage(screenshots);
			promises.push(writeFile("tests/visual/screenshots/index.html", screenshotspage));

			// add path to screenshots
			screenshots = screenshots.map(function(screenshot) {
				return "tests/visual/screenshots/" + screenshot;
			});
			console.log("Screenshots located at " + aws_shots_index);
		} else {
			console.log("No screenshots here");
		}

		if (fs.existsSync("tests/visual/failures")) {
			failures = fs.readdirSync("tests/visual/failures");
			var failurespage = buildIndexPage(failures);
			promises.push(writeFile("tests/visual/failures/index.html", failurespage));

			// add path to failures
			for (var y = 0; y < failures.length; y++) {
				failures[y] = "tests/visual/failures/" + failures[y];
			}

			console.log("Failure screenshots located at " + aws_fails_index);
		} else {
			console.log("No failures found");
		}

		return Promise.all(promises);
	})
	.then(function() {
		var promises = [];

		promises.push(deployToAWS(screenshots, aws_shot_dest));
		promises.push(deployToAWS(["tests/visual/screenshots/index.html"], aws_shot_dest));

		if (fs.existsSync("tests/visual/failures")) {
			promises.push(deployToAWS(failures, aws_fail_dest));
			promises.push(deployToAWS(["tests/visual/failures/index.html"], aws_fail_dest));
		}

		return Promise.all(promises);
	})

	// Make a comment if a changed has been detected and it's a PR build
	.then(function() {
		var pullRequest = process.env.TRAVIS_PULL_REQUEST;
		var repoSlug = process.env.TRAVIS_REPO_SLUG.split('/');

		if ((pullRequest !== "false") && (failures !== undefined)) {
			return createComment({
					user: repoSlug[0],
					repo: repoSlug[1],
					number: pullRequest,
					body: "Image diffs found between branch and production" +
					"\nSee" +
					"\n\n" + aws_fails_index
				})
				.then(function(data) {
					console.log(data);
				});
		} else {
			console.log("No comments to make to Pull Request");
		}
	})
	.catch(function(err) {
		console.log("there was an error");
		console.log(err.stack);
		process.exit(1);
	});

function getAllElementsOnWidth(json, width) {
	var elementObject = {};
	Object.keys(json.elements).forEach(function(item) {
		var element = json.elements[item];
		var widths = element.widths;
		if (widths.indexOf(width) !== -1) {
			elementObject[element.name] = element.css;
		}
	});
	return elementObject;
}

function collectWidths(json) {
	var compiledWidths = [];
	Object.keys(json.elements).forEach(function(item) {
		var widths = json.elements[item].widths;
		for (var x = 0; x < widths.length; x++) {
			if (compiledWidths.indexOf(widths[x]) === -1) {
				compiledWidths.push(widths[x]);
			}
		}
	});
	return compiledWidths;
}

function buildIndexPage(screenshots) {
	var html = "<html><body>";
	for (var j = 0; j < screenshots.length; j++) {
		if (screenshots[j].indexOf("base.png") !== -1) {
			var matchingshot = screenshots[j].replace("base.png", "test.png");
			html += "<p>" + screenshots[j] + "</p>" +
			'<p><p></p></p><img src="' + screenshots[j] + '">' + "</p>";
			html += "<p>" + matchingshot + "</p>" +
			'<p><p></p><img src="' + matchingshot + '">' + "</p>";
		}
		if (screenshots[j].indexOf("fail.png") !== -1){
			html += "<p>" + screenshots[j] + "</p>" +
			'<p><p></p></p><img src="' + screenshots[j] + '">' + "</p>";
		}
	}
	html += "</body></html>";
	return html;
}

function deployToAWS(files, destination) {
	return deployStatic({
		files: files,
		destination: destination,
		region: 'eu-west-1',
		bucket: 'ft-next-qa',
		strip: 3
	});
}
