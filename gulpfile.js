var gulp = require('gulp');
var watch = require('gulp-watch');
var obt = require('origami-build-tools');

gulp.task('default', function () {
	obt.build(gulp, {
		sass: './client/main.scss',
		js: './client/main.js',
		buildFolder: './public'
	});
});

gulp.task('watch', function() {
	gulp.watch('./client/**/*', ['default']);
});
