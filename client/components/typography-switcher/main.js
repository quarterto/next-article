'use strict';

var Superstore = require('superstore');
var store = new Superstore('ft');
var storeKey = 'typog-switcher';
var variantPattern = new RegExp(storeKey + ':(variant-[0-9])');

function isValidVariant(variant) {
	return variantPattern.test(storeKey + ':' + variant);
}

function addVariantClassName(variant) {
	document.body.classList.add('typog-variant', 'typog-variant--' + variant);
}

function removeVariantClassNames() {
	document.body.className = document.body.className.replace(/typog-variant--variant-[0-9]/g, '');
}

function bindEvents() {
	window.addEventListener('hashchange', updateVariantState, false);
}

function updateVariantState() {
	var hashMatch = document.location.hash.match(variantPattern);
	var requestedVariant = hashMatch && hashMatch[1];

	if (requestedVariant) {
	// Variant requested via URL
		removeVariantClassNames();
		addVariantClassName(requestedVariant);
		store.set(storeKey, requestedVariant);
	} else {
	// Check for saved variant
		store.get(storeKey, function (err, savedVariant) {
			// So we don't blindly append to body's className
			if (isValidVariant(savedVariant)) {
				addVariantClassName(savedVariant);
			}
		});
	}
}

module.exports.init = function(flags) {
	if (!flags.get('typographySwitcher')) {
		return;
	}
	updateVariantState();
	bindEvents();
};
