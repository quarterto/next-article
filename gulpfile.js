/*jshint node:true*/
'use strict';

var gulp = require('gulp');
require('gulp-watch');
var concat = require('gulp-concat');
var uglify = require('uglify-js');
var sourcemap = require('convert-source-map');
var obt = require('origami-build-tools');
var through = require('through2');
var source = require('vinyl-source-stream');
var streamify = require('gulp-streamify');

var fs =require('fs');
var path = require('path');


function writeSourceMap(fileName, contents, done){
	console.log('writeSourceMap', fileName);
	var sourceMapFile = fs.createWriteStream(path.resolve(fileName));
	sourceMapFile.on('open', function(){
		sourceMapFile.write(contents, 'utf8', done);
	});
}


function extractSourceMap(opt){

	var fileName = opt.sourceMap;
	console.log('extractSourceMap', opt, fileName);

	function extract(file, enc, cb){
		var fileContents = file.contents.toString();
		//console.log(fileContents);
		var sourceMapContents = sourcemap.fromSource(fileContents).toJSON();
		writeSourceMap(fileName, sourceMapContents, function(){
			cb(null, file);
		});
	}

	return through.obj(extract);
}

function minify(opt){

	var sourceMapIn = opt.sourceMapIn;
	var sourceMapOut = opt.sourceMapOut;

	console.log('minify', opt);

	function minifyFile(file, enc, cb){
		if (file.isNull()) return cb(null, file);
		if (file.isStream()) return cb(new Error('Streaming not supported'));
		var result = uglify.minify(file.contents.toString(), {
			fromString:true,
			inSourceMap:sourceMapIn,
			outSourceMap:sourceMapOut,
			sourceMapIncludeSources:true
		});
		file.contents = new Buffer(result.code, 'utf8');
		writeSourceMap(sourceMapIn, result.map, function(){
			cb(null, file);
		});
	}

	return through.obj(minifyFile);

}

var mainJsFile = './public/main.js';

function getOBTConfig(env){
	return {
		sass: './client/main.scss',
		js: './client/main.js',
		buildFolder: './public',
		env: env,
		sourcemaps : true
	};
}


gulp.task('build-js', function () {
	return obt.build.js(gulp, getOBTConfig(process.env.ENVIRONMENT || 'development'));
});

gulp.task('build-sass', function(){
	return obt.build.sass(gulp, getOBTConfig(process.env.ENVIRONMENT || 'production'));
});

gulp.task('build', ['build-js', 'build-sass']);

gulp.task('minify-js',['build-js'], function(){
	var sourceMapFile = './public/main.js.map';
	return gulp.src(mainJsFile)
		.pipe(extractSourceMap({sourceMap:sourceMapFile}))
		.pipe(minify({sourceMapIn:sourceMapFile,sourceMapOut:'/grumman/main.js.map'}))
		.pipe(gulp.dest('./public/'));
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
gulp.task('build-prod', ['build-js', 'minify-js']);

gulp.task('default', ['build-dev']);
