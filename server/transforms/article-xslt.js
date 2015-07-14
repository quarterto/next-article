'use strict';

var fs = require('fs');
var tempWrite = require('temp-write');
var spawn = require('child_process').spawn;

module.exports = function(content, stylesheet, params) {
	return new Promise(function(resolve, reject) {

		tempWrite(content, 'article.xml', function(err, tmpFile) {
			if (err) {
				return reject(err);
			}

			var output = [];
			var errors = [];
			var options = [
				'--html',
				'--novalid',
				'--encoding', 'utf-8'
			];

			params && Object.keys(params).forEach(function(param) {
				var string = typeof params[param] === 'string';
				options = options.concat(string ? '--stringparam' : '--param', param, params[param]);
			});

			var xsltproc = spawn('xsltproc', options.concat(
				process.cwd() + '/server/stylesheets/' + stylesheet + '.xsl',
				tmpFile
			), { env: process.env });

			xsltproc.stdout.on('data', function(data) {
				output.push(data);
			});

			xsltproc.stderr.on('data', function(error) {
				errors.push(error.toString());
			});

			xsltproc.on('error', function(error) {
				reject(error.toString());
			});

			xsltproc.on('close', function(code) {
				fs.unlink(tmpFile, null);

				if (code !== 0) {
					console.log.apply(console, errors);
					return reject('xsltproc exited with code ' + code);
				}

				resolve(output.join('').replace(/<\/?html>/g, ''));
			});
		});

	});
};
