/*jshint node:true*/
'use strict';

var gulp = require('gulp');
require('gulp-watch');
var obt = require('origami-build-tools');

gulp.task('build', function () {
	obt.build(gulp, {
		sass: './client/main.scss',
		js: './client/main.js',
		buildFolder: './public',
		env: process.env.ENVIRONMENT || 'production'
	});
});

gulp.task('watch', function() {
	gulp.watch('./client/**/*', ['default']);
});

gulp.task('default', ['build']);
