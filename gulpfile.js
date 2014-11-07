var gulp = require('gulp');
var watch = require('gulp-watch');
var del = require('del');
var obt = require('origami-build-tools');

gulp.task('build', function () {
	obt.build(gulp, {
		sass: './client/main.scss',
		js: './client/main.js',
		buildFolder: './public'
	});
});

gulp.task('clean_templates', function(cb) {
	del([
	    'templates/components/bower'
	], cb);
});

gulp.task('copy_templates', ['clean_templates'], function() {
	gulp.src('./bower_components/next-*/templates/**/*.html', {base: './bower_components'})
		.pipe(gulp.dest('./templates/components/bower'));
});

gulp.task('watch', function() {
	gulp.watch('./client/**/*', ['default']);
});

gulp.task('default', ['build', 'copy_templates']);