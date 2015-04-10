"use strict";

var hogan = require('hogan');

/**
 * Mustache templates, compiled but not rendered.
 * @type {Object}
 */
module.exports = {
	unavailableTemplate: hogan.compile(requireText('../templates/unavailable.ms')),
	termsAndGuidelinesTemplate: hogan.compile(requireText('../templates/termsAndGuidelines.ms')),
	clearLine: hogan.compile(requireText('../templates/clearLine.ms')),
	commentingSettingsLink: hogan.compile(requireText('../templates/commentingSettingsLink.ms'))
};
