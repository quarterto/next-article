"use strict";

require('es6-promise').polyfill();

var moment = require('moment');
var normalizeName = require('next-build-tools/lib/normalize-name');
var exec = require('next-build-tools/lib/exec');
var packageJson = require('../../package.json');

var fs = require('fs');
var denodeify = require('denodeify');
var writeFile = denodeify(fs.writeFile);
var deployStatic = require('next-build-tools').deployStatic;
var GitHubApi = require('github');
var github = new GitHubApi({ version: "3.0.0", debug: false });
var createComment = denodeify(github.issues.createComment);

// env variables
var commit = process.env.GIT_HASH;
var page_data = require('./config');

var screenshots;
var failures;

var AWS_DEST_PREFIX = "image_diffs/" + normalizeName(packageJson.name, { version: false }) + "/" + moment().format('YYYY-MM-DD') + "/" + moment().format('HH:mm') + "-" + commit + "/";
var AWS_SHOTS_INDEX = "https://s3-eu-west-1.amazonaws.com/ft-next-qa/" + AWS_DEST_PREFIX + "/successes/index.html";
var AWS_FAILS_INDEX = "https://s3-eu-west-1.amazonaws.com/ft-next-qa/" + AWS_DEST_PREFIX + "/failures/index.html";

console.log("Running image diff tests");

var imageDiffPromises = [];

Object.keys(page_data).forEach(function(page) {
	var testHost = "http://" + process.env.TEST_HOST + ".herokuapp.com";
	var baseHost = "http://next.ft.com";
	var pageName = page_data[page].name;
	var path = page_data[page].path;
	var widths = collectWidths(page_data[page]);
	widths.forEach(function(width) {
		var height = 1000;
		var elements = getAllElementsOnWidth(page_data[page], width);
		var test = "\nPage name  : " + pageName +
			"\npath       : " + path +
			"\ndimensions : " + width + "x" + height +
			"\ntesthost    : " + testHost +
			"\nbasehost   : " + baseHost +
			"\nelements " + JSON.stringify(elements);

		console.log("\nStarting test for " + test);

		imageDiffPromises.push(
			exec("casperjs " + [
				"--width=" + width,
				"--height=" + height,
				"--pagename='" + pageName + "'",
				"--path='" + path + "'",
				"--elements='" + JSON.stringify(elements) + "'",
				"--testhost='" + testHost + "'",
				"--basehost='" + baseHost + "'",
				"test",
				"tests/visual/elements-test.js"
			].join(' '))
		);
	});
});

Promise.all(imageDiffPromises)
	.then(function(result) {
		var promises = [];
		console.log("\n\nCasperJS output: \n\n" + result);

		if (fs.existsSync("tests/visual/screenshots/successes")) {

			// find all screenshots and build an html page to display them
			screenshots = fs.readdirSync("tests/visual/screenshots/successes");
			var screenshotspage = buildIndexPage(screenshots);
			promises.push(writeFile("tests/visual/screenshots/successes/index.html", screenshotspage));

			// add path to screenshots
			screenshots = screenshots.map(function(screenshot) {
				return "tests/visual/screenshots/successes/" + screenshot;
			});
			console.log("Screenshots located at " + AWS_SHOTS_INDEX);
		} else {
			console.log("No screenshots here");
		}

		if (fs.existsSync("tests/visual/screenshots/failures")) {
			failures = fs.readdirSync("tests/visual/screenshots/failures");
			var failurespage = buildIndexPage(failures);
			promises.push(writeFile("tests/visual/screenshots/failures/index.html", failurespage));

			// add path to failures
			failures = failures.map(function(failure) {
				return "tests/visual/screenshots/failures/" + failure;
			});
			console.log("Failure screenshots located at " + AWS_FAILS_INDEX);
		} else {
			console.log("No failures found");
		}

		return Promise.all(promises);
	})
	.then(function() {
		var files = ["tests/visual/screenshots/successes/index.html"]
			.concat(screenshots);

		if (fs.existsSync("tests/visual/screenshots/failures")) {
			files = files
				.concat(failures)
				.concat(["tests/visual/screenshots/failures/index.html"]);
		}

		return deployStatic({
			files: files,
			destination: AWS_DEST_PREFIX,
			region: 'eu-west-1',
			bucket: 'ft-next-qa',
			strip: 3
		});
	})

	// Make a comment if a changed has been detected and it's a PR build
	.then(function() {
		var pullRequest = process.env.TRAVIS_PULL_REQUEST;
		var repoSlug = process.env.TRAVIS_REPO_SLUG.split('/');

		if ((pullRequest !== "false") && (failures !== undefined)) {
			github.authenticate({ type: "oauth", token: process.env.GITHUB_OAUTH });
			return createComment({
					user: repoSlug[0],
					repo: repoSlug[1],
					number: pullRequest,
					body: "Image diffs found between branch and production" +
					"\nSee" +
					"\n\n" + AWS_FAILS_INDEX
				})
				.then(function(data) {
					console.log(data);
				});
		} else {
			console.log("No comments to make to Pull Request");
		}
	})
	.then(function() {
		console.log("finished visual regression tests");
		process.exit(0);
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
