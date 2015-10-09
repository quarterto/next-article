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
	},
	livefyre: false
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
	
	fetch('https://session-user-data.webservices.ft.com/v1/livefyre/init?title=Terror+must+not+trample+on+Tunisian+institutions+%E2%80%94+FT.com&url=https%3A%2F%2Fnext.ft.com%2Fcontent%2F4b949d2c-1fdc-11e5-ab0f-6bb9974f25d0&articleId=4b949d2c-1fdc-11e5-ab0f-6bb9974f25d0&el=comments&stream_type=livecomments&callback=jsonp_m49qbwvzpvi0&_=1444384681349')
	.then((res) => { statuses['livefyre'] = res.ok; })
	.catch(() => { statuses['livefyre'] = false; });
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

function livefyreStatus() {
	return {
		getStatus: () => ({
			name: 'session-user-data.webservices.ft.com (livefyre) responded successfully.',
			ok: statuses['livefyre'],
			businessImpact: 'Users may not see comments at bottom of article',
			severity: 3,
			technicalSummary: 'Fetches the session-user-data call used on the client side to initialise comments'
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
	capiv2: buildStatus('capi', 'v2'),
	livefyre: livefyreStatus()
};
