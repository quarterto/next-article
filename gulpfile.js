'use strict';

var gulp = require('gulp');
require('gulp-watch');
var notify = require("gulp-notify");

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

gulp.task('watch', function() {
	gulp.watch('./client/**/*.js', ['build-js']);
	gulp.watch('./client/**/*.scss', ['build-sass']);
});

gulp.task('build-dev', ['build']);
gulp.task('build-prod', ['build', 'minify-js']);

gulp.task('default', ['build-dev']);
