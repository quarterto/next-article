"use strict";

/**
 * This submodule is meant to generate a callback only when all functions provided finished their execution.
 * This is achieved by passing a callback as parameter to the functions that are executed.
 *
 * @param  {Object}    functions     Object with named functions (key-value pairs) that should be executed and synced.
 * @param  {Function} finalCallback Callback that is called when all functions finished their job. It also gets a parameter which aggregates data from all functions.
 */
function parallel (functions, finalCallback) {
	var key;

	var done = false;
	var dataAggregate = {};

	var status = {};

	for (key in functions) {
		if (functions.hasOwnProperty(key)) {
			status[key] = false;
		}
	}

	var verify = function () {
		var statusKey;

		for (statusKey in status) {
			if (status.hasOwnProperty(statusKey)) {
				if (!status[statusKey]) {
					return false;
				}
			}
		}

		if (!done) {
			finalCallback(null, dataAggregate);
		}
	};


	var callTheFunction = function (_key) {
		var thisCallbackDone = function (err, data) {
			if (!done) {
				if (err) {
					done = true;

					finalCallback({
						key: _key,
						error: err
					});
					return;
				}

				status[_key] = true;
				dataAggregate[_key] = data;

				verify();
			}
		};

		if (typeof functions[_key] === 'function') {
			functions[_key](thisCallbackDone);
		} else if (typeof functions[_key] === 'object' && typeof functions[_key].func === 'function') {
			if (functions[_key].hasOwnProperty('args')) {
				var args = functions[_key].args;
				args.splice(0, 1, thisCallbackDone);

				functions[_key].func.apply(this, args);
			} else {
				functions[_key].func(thisCallbackDone);
			}
		}
	};

	for (key in functions) {
		if (functions.hasOwnProperty(key)) {
			callTheFunction(key);
		}
	}
}
module.exports = parallel;
