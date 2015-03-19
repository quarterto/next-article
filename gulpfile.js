'use strict';

var gulp = require('gulp');
require('gulp-watch');
var notify = require("gulp-notify");
var hash = require('gulp-hash');

var obt = require('origami-build-tools');
var extractSourceMap = require('next-gulp-tasks').extractSourceMap;
var minify = require('next-gulp-tasks').minify;
var getOBTConfig = require('next-gulp-tasks').getOBTConfig;
// to be safe, default to production
var env = process.env.ENVIRONMENT || 'production';

var mainJsFile = './public/main.js';

gulp.task('build-js', function () {
	// need to run as development, or can't get sourcemaps
	return obt.build.js(gulp, getOBTConfig('development'))
		.pipe(notify('Grumman JS built'));
});

gulp.task('build-sass', function(){
	return obt.build.sass(gulp, getOBTConfig(env))
		.pipe(notify('Grumman Sass built'));
});

gulp.task('build', ['build-js', 'build-sass']);

gulp.task('minify-js',['build-js'], function(){
	if (env === 'production') {
		var sourceMapFile = './public/main.js.map';
		return gulp.src(mainJsFile)
			.pipe(extractSourceMap({saveTo:sourceMapFile}))
			.pipe(minify({sourceMapIn:sourceMapFile,sourceMapOut:'/grumman/main.js.map'}))
			.pipe(gulp.dest('./public/'));
	}
});

// TODO: Move into next-gulp-tasks
gulp.task('hash', function() {
	gulp.src('./public/*.*')
		.pipe(hash()) // Add hashes to the files' names
		.pipe(gulp.dest('hashed-assets/')) // Write the now-renamed files
		.pipe(hash.manifest('asset-hashes.json')) // Change the stream to the manifest file
		.pipe(gulp.dest('public')); // Write the manifest file
});

gulp.task('watch', function() {
	gulp.watch('./client/**/*.js', ['build-js']);
	gulp.watch('./client/**/*.scss', ['build-sass']);
});

gulp.task('build-dev', ['build']);
gulp.task('build-prod', ['build', 'minify-js']);

gulp.task('default', ['build-dev']);
