module.exports = [{
		urls: {
			//methode
			'/02cad03a-844f-11e4-bae9-00144feabdc0': 200,
			//fastft
			'/b002e5ee-3096-3f51-9925-32b157740c98': 200,
			// related frgaments
			'/article/f2b13800-c70c-11e4-8e1f-00144feab7de/topics': 200,
			'/article/notreal1-c70c-11e4-8e1f-00144feab7de/topics': 404,
			'/article/02cad03a-844f-11e4-bae9-00144feabdc0/story-package': 200,
			'/article/f2b13800-c70c-11e4-8e1f-00144feab7de/regions': 200,
			'/article/notreal1-c70c-11e4-8e1f-00144feab7de/regions': 404,
			'/article/f2b13800-c70c-11e4-8e1f-00144feab7de/people': 200,
			'/article/notreal1-c70c-11e4-8e1f-00144feab7de/people': 404,
			'/article/f2b13800-c70c-11e4-8e1f-00144feab7de/organisations': 200,
			'/article/notreal1-c70c-11e4-8e1f-00144feab7de/organisations': 404,
			'/article/02cad03a-844f-11e4-bae9-00144feabdc0/more-on?metadata-fields=primaryTheme': 200
		}
	},
	{
		//elastic search off fallback
		headers: {
			Cookie: 'next-flags=elasticSearchItemGet:off'
		},
		urls: {
			'/0369dd4e-8513-11e1-2a93-978e959e1fd3': 200
		}
	}];
