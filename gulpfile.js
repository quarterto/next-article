/*jshint node:true*/
'use strict';

var gulp = require('gulp');
require('gulp-watch');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var obt = require('origami-build-tools');
var through = require('through2');
var fs = require('fs');


function gulpSourcemapExtration(opt){
	var app  = opt.app,
		filePathTransformationRegex = new RegExp('^.+/next-' + app, 'i');


	function transformFilePath(path){
		return path.replace(filePathTransformationRegex, '/' + app);
	}

	function extract(file, enc, cb){
		if (file.isNull()) return cb(null, file);
		if (file.isStream()) return cb(new PluginError('gulp-coffee', 'Streaming not supported'));

		//var regex = new RegExp('^\/\/# sourceMappingURL=data:application\/json;base64(.+)$'),
		var regex = /^\/\/# sourceMappingURL=data:application\/json;base64,(.+)$/m,
			contents = file.contents.toString('utf8'),
			newContents = contents.replace(regex, "//# sourceMappingURL=/" + app + "/main.js.map"),
			results = regex.exec(contents),
			sourcemapStr,
			sourcemapObj

		if(results && results.length > 1){
			sourcemapStr = new Buffer(results[1], 'base64').toString('utf8');
			sourcemapObj = JSON.parse(sourcemapStr);
			sourcemapObj.sources = sourcemapObj.sources.map(transformFilePath);
			fs.writeFile(jsSourcemapFile, JSON.stringify(sourcemapObj), function(){
				file.contents = new Buffer(newContents);
				cb(null, file);
			});
			return;
		}

		cb(new Error("Failed to parse out sourcemap"), null);
	}

	return through.obj(extract);
}

var mainJsFile = './public/main.js';
var jsSourcemapFile = './public/main.js.map';


gulp.task('build', function () {
	return obt.build(gulp, {
		sass: './client/main.scss',
		js: './client/main.js',
		buildFolder: './public',
		env: 'development'
	});
});

gulp.task('minify-js',['build'], function(){
	return gulp.src(mainJsFile)
		.pipe(sourcemaps.init({loadMaps:true}))
			.pipe(concat(mainJsFile))
			.pipe(uglify())
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('.'))
});

gulp.task('sourcemap', ['build', 'minify-js'], function(){
	return gulp.src(mainJsFile)
		.pipe(gulpSourcemapExtration({app:'grumman'}))
		.pipe(gulp.dest('./public/'));
});

gulp.task('watch', function() {
	gulp.watch('./client/**/*', ['default']);
});

gulp.task('build-dev', ['build']);
gulp.task('build-prod', ['build', 'minify-js', 'sourcemap']);

gulp.task('default', ['build-dev']);
