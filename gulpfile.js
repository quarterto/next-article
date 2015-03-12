'use strict';

var gulp = require('gulp');
require('gulp-watch');
var notify = require("gulp-notify");

var obt = require('origami-build-tools');
var extractSourceMap = require('next-gulp-tasks').extractSourceMap;
var minify = require('next-gulp-tasks').minify;
var getOBTConfig = require('next-gulp-tasks').getOBTConfig;

var mainJsFile = './public/main.js';

gulp.task('build-js', function () {
	return obt.build.js(gulp, getOBTConfig(process.env.ENVIRONMENT || 'development'))
		.pipe(notify('Grumman JS built'));
});

gulp.task('build-sass', function(){
	return obt.build.sass(gulp, getOBTConfig(process.env.ENVIRONMENT || 'production'))
		.pipe(notify('Grumman Sass built'));
});

gulp.task('build', ['build-js', 'build-sass']);

gulp.task('minify-js',['build-js'], function(){
	var sourceMapFile = './public/main.js.map';
	return gulp.src(mainJsFile)
		.pipe(extractSourceMap({saveTo:sourceMapFile}))
		.pipe(minify({sourceMapIn:sourceMapFile,sourceMapOut:'/grumman/main.js.map'}))
		.pipe(gulp.dest('./public/'));
});


gulp.task('watch', function() {
	gulp.watch('./client/**/*.js', ['build-js']);
	gulp.watch('./client/**/*.scss', ['build-sass']);
});

gulp.task('build-dev', ['build']);
gulp.task('build-prod', ['build', 'minify-js']);

gulp.task('default', ['build-dev']);
