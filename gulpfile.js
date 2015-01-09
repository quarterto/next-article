/*jshint node:true*/
'use strict';

var gulp = require('gulp');
require('gulp-watch');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var obt = require('origami-build-tools');
var through = require('through2');
function fixSourcemapUrl(opt){
	var app = opt.app;

	function extract(file, enc, cb){
		if (file.isNull()) return cb(null, file);
		if (file.isStream()) return cb(new Error('Streaming not supported'));
		var regex = new RegExp('^(//# sourceMappingURL=)(.+)/(main.js.map)$', 'm');
		var contents = file.contents.toString('utf8');
		var newContents = contents.replace(regex, "$1/" + app + "/$3");
		file.contents = new Buffer(newContents);
		cb(null, file);
	}

	return through.obj(extract);
}

var mainJsFile = './public/main.js';

function getOBTConfig(env){
	return {
		sass: './client/main.scss',
		js: './client/main.js',
		buildFolder: './public',
		env: env
	};
}


gulp.task('build-js', function () {
	return obt.build.js(gulp, getOBTConfig(process.env.ENVIRONMENT || 'production'));
});

gulp.task('build-sass', function(){
	return obt.build.sass(gulp, getOBTConfig(process.env.ENVIRONMENT || 'production'));
});

gulp.task('build', ['build-js', 'build-sass']);

gulp.task('minify-js',['build'], function(){
	return gulp.src(mainJsFile)
		.pipe(sourcemaps.init({loadMaps:true}))
			.pipe(concat(mainJsFile))
			.pipe(uglify())
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('.'));
});

gulp.task('sourcemap', ['minify-js'], function(){
	return gulp.src(mainJsFile)
		.pipe(fixSourcemapUrl({app:'grumman'}))
		.pipe(gulp.dest('./public/'));
});

gulp.task('watch', function() {
	gulp.watch('./client/**/*', ['default']);
});

gulp.task('build-dev', ['build']);
gulp.task('build-prod', ['build', 'minify-js', 'sourcemap']);

gulp.task('default', ['build-dev']);
