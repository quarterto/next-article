var gulp = require('gulp');
var watch = require('gulp-watch');
var obt = require('origami-build-tools');

gulp.task('default', function () {
	obt.build(gulp, {
		sass: './static/styles.scss',
		buildFolder: './static',
		buildCss: 'styles.css'
	});
});

gulp.task('watch', function() {
	gulp.watch('./static/**/*.scss', ['default']);
});
