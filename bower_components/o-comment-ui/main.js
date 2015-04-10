"use strict";

var oCommentUtilities = require('o-comment-utilities');

/**
 * Exports of submodules
 */

exports.Widget = require('./src/javascripts/Widget.js');
exports.WidgetUi = require('./src/javascripts/WidgetUi.js');
exports.userDialogs = require('./src/javascripts/userDialogs.js');

exports.i18n = require('./src/javascripts/i18n.js');
exports.templates = require('./src/javascripts/templates.js');
exports.utils = require('./src/javascripts/utils.js');

exports.overlayContentBuilder = {
	OverlayFormContent: require('./src/javascripts/overlay_content_builder/OverlayFormContent.js'),
	formFragments: require('./src/javascripts/overlay_content_builder/formFragments.js')
};

/**
 * Enables logging.
 * @type {function}
 */
exports.enableLogging = function () {
	oCommentUtilities.logger.enable.apply(this, arguments);
};

/**
 * Disables logging.
 * @type {function}
 */
exports.disableLogging = function () {
	oCommentUtilities.logger.disable.apply(this, arguments);
};

/**
 * Sets logging level.
 * @type {number|string}
 */
exports.setLoggingLevel = function () {
	oCommentUtilities.logger.setLevel.apply(this, arguments);
};
