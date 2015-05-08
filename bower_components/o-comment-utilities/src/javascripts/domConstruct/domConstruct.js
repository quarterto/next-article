"use strict";

var generateId = require('../generateId/generateId.js');

function getCamelCaseName (str) {
	var parts = str.split('-');
	var result = parts[0];

	for (var i = 1; i < parts.length; i++) {
		result += parts[i].charAt(0).toUpperCase() + parts[i].slice(1);
	}

	return result;
}

module.exports = function (config) {
	var el = config.context;

	if (!el) {
		el = document.body;
	} else if (!(el instanceof HTMLElement)) {
		el = document.querySelector(el);
	}

	var instances = el.querySelectorAll('[data-o-component="'+ config.classNamespace +'"]');

	var item;
	var meetsReqs;
	var widgets = [];

	for (var i = 0; i < instances.length; i++) {
		item = instances[i];

		meetsReqs = !item.getAttribute('data-' + config.classNamespace + '-built');
		if (config.auto) {
			meetsReqs = meetsReqs && item.getAttribute('data-' + config.classNamespace + '-auto-init') !== "false";
		}

		if (meetsReqs) {
			if (!item.id) {
				// generate an ID
				item.id = config.classNamespace + '--' + generateId();
			}

			// prevent rebuilding it again
			item.setAttribute('data-' + config.classNamespace + '-built', "true");

			var widgetConfig = {};
			var match;
			var itemsInConfig;
			var currentLevel;
			var camelCaseConfigName;

			for (var j = 0; j < item.attributes.length; j++) {
				match = item.attributes[j].name.match(new RegExp('data-' + config.classNamespace + '-config-(.*)'));
				if (match && match.length) {
					itemsInConfig = match[1].split('--');
					currentLevel = widgetConfig;

					for (var k = 0; k < itemsInConfig.length; k++) {
						camelCaseConfigName = getCamelCaseName(itemsInConfig[k]);
						if (k === itemsInConfig.length - 1) {
							// last level
							currentLevel[camelCaseConfigName] = item.attributes[j].value;
						} else {
							// there's one more level
							if (!currentLevel[camelCaseConfigName]) {
								currentLevel[camelCaseConfigName] = {};
								currentLevel = currentLevel[camelCaseConfigName];
							}
						}
					}
				}
			}

			var widget = new config.module(item, widgetConfig);

			document.body.dispatchEvent(new CustomEvent(config.eventNamespace + '.ready', {
				detail: {
					id: item.id,
					instance: widget
				},
				bubble: true
			}));

			widgets.push(widget);
		}
	}

	return widgets;
};
