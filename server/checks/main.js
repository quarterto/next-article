'use strict';

var api = require('next-ft-api-client');

const ARTICLE_ID = "d0377096-f290-11e4-b914-00144feab7de";
const INTERVAL = 60 * 1000;

const statuses = {
	elastic: {
		v1: false,
		v2: false
	},
	capi: {
		v1: false,
		v2: false
	}
};

/**
 * Calls CAPI and elasticsearch for both V1 & V2 and updates [statuses]
 * in the parent scope.
 * @method pingServices
 */
function pingServices() {
	[ {useElastic: true}, {useElastic: false} ]
		.forEach(config => {
			const backend = config.useElastic ? 'elastic' : 'capi';

			api.contentLegacy({
				uuid: ARTICLE_ID,
				useElasticSearch: config.useElastic
			})
			.then(() => { statuses[backend].v1 = true; })
			.catch(() => { statuses[backend].v1 = false; });

			api.content({
				uuid: ARTICLE_ID,
				type: 'Article',
				metadata: true,
				useElasticSearch: config.useElastic
			})
			.then(() => { statuses[backend].v2 = true; })
			.catch(() => { statuses[backend].v2 = false; });
	});
}

/**
 * Creates a object to be passed to healthchecks. Fetching the latest status from [statuses]
 * @method buildStatus
 * @param  {String}    backend The backend we are fetching from; ['elastic', 'capi']
 * @param  {String}    version The CAPI version; ['v1', 'v2']
 * @return {Object}
 */
function buildStatus(backend, version) {
	return {
		getStatus: () => ({
			name: `${backend}:${version} responded successfully.`,
			ok: statuses[backend][version],
			businessImpact: "Users may not see article content.",
			severity: 2,
			technicalSummary: "Fetches an article to determine whether the service is running."
		})
	};
}


module.exports = {
	init: function() {
		pingServices();
		setInterval(pingServices, INTERVAL);
	},
	esv1: buildStatus('elastic', 'v1'),
	esv2: buildStatus('elastic', 'v2'),
	capiv1: buildStatus('capi', 'v1'),
	capiv2: buildStatus('capi', 'v2')
};
