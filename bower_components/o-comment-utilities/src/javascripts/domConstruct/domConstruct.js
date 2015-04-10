"use strict";

var generateId = require('../generateId/generateId.js');

module.exports = function (config) {
	var instances = document.querySelectorAll('.' + config.baseClass);

	var item;
	var meetsReqs;
	for (var i = 0; i < instances.length; i++) {
		item = instances[i];


		meetsReqs = item.getAttribute('data-' + config.baseClass + '-built') !== "true";
		if (config.auto) {
			meetsReqs = meetsReqs && item.getAttribute('data-' + config.baseClass + '-autoconstruct') === "true";
		}

		if (meetsReqs) {
			if (!item.id) {
				// generate an ID
				item.id = config.baseClass + '--' + generateId();
			}

			// prevent rebuilding it again
			item.setAttribute('data-' + config.baseClass + '-built', "true");

			var widgetConfig = {
				elId: item.id
			};
			var match;

			for (var j = 0; j < item.attributes.length; j++) {
				match = item.attributes[j].name.match(new RegExp('data-' + config.baseClass + '-config-(.*)'));
				if (match && match.length) {
					widgetConfig[match[1]] = item.attributes[j].value;
				}
			}

			var widget = new config.Widget(widgetConfig);

			document.body.dispatchEvent(new CustomEvent(config.namespace + '.domConstruct', {
				detail: {
					id: item.id,
					instance: widget
				},
				bubble: true
			}));

			widget.load();
		}
	}
};
