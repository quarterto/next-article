module.exports = [
	{
		timeout: 5000,
		urls: {
			//methode
			'/02cad03a-844f-11e4-bae9-00144feabdc0': 200,
			//fastft
			'/b002e5ee-3096-3f51-9925-32b157740c98': 200,
			// related fragments
			'/article/8b11ca16-45bf-11e5-b3b2-1672f710807b/topics': 200,
			'/article/notreal1-c70c-11e4-8e1f-00144feab7de/topics': 404,
			'/article/02cad03a-844f-11e4-bae9-00144feabdc0/story-package': 200,
			'/article/8b11ca16-45bf-11e5-b3b2-1672f710807b/regions': 200,
			'/article/notreal1-c70c-11e4-8e1f-00144feab7de/regions': 404,
			'/article/8b11ca16-45bf-11e5-b3b2-1672f710807b/people': 200,
			'/article/notreal1-c70c-11e4-8e1f-00144feab7de/people': 404,
			'/article/8b11ca16-45bf-11e5-b3b2-1672f710807b/organisations': 200,
			'/article/notreal1-c70c-11e4-8e1f-00144feab7de/organisations': 404,
			'/article/02cad03a-844f-11e4-bae9-00144feabdc0/more-on?metadata-fields=primaryTheme': 200,
			// articles with not tagged with X
			'/article/a1fb6fee-93ae-359d-be8f-f215920b79ff/more-on?metadata-fields=primaryTheme': {
				content: ''
			},
			'/article/080684d2-3768-11e5-bdbb-35e55cbae175/topics': {
				content: ''
			},
			'/article/e738cc50-419a-11e5-b98b-87c7270955cf/organisations': {
				content: ''
			},
			'/article/7ad99388-2c81-11e5-acfb-cbd2e1c81cca/regions': {
				content: ''
			},
			'/article/7ad99388-2c81-11e5-acfb-cbd2e1c81cca/people': {
				content: ''
			}
		}
	},
	{
		//elastic search off fallback
		timeout: 5000,
		headers: {
			Cookie: 'next-flags=elasticSearchItemGet:off'
		},
		urls: {
			'/02cad03a-844f-11e4-bae9-00144feabdc0': 200
		}
	},
	{
		// test access
		timeout: 5000,
		headers: {
			'X-FT-Access-Metadata': 'remote_headers'
		},
		urls: {
			// conditional standard article
			'/b30c8de4-4754-11e5-af2f-4d6e0e5eda22': {
				status: 200,
				headers: {
					'X-FT-Content-Classification': 'conditional_standard'
				}
			},
			// unconditional article
			'/459ef70a-4a43-11e5-b558-8a9722977189': {
				status: 200,
				headers: {
					'X-FT-Content-Classification': 'unconditional'
				}
			},
			// conditional premium article
			'/fe857b82-4add-11e5-9b5d-89a026fda5c9': {
				status: 200,
				headers: {
					'X-FT-Content-Classification': 'conditional_premium'
				}
			},
			// fastft
			'/b002e5ee-3096-3f51-9925-32b157740c98': {
				status: 200,
				headers: {
					'X-FT-Content-Classification': 'conditional_standard'
				}
			},
			// alphaville
			'/06d867f9-37d0-3ea8-965e-34043575e607': {
				status: 200,
				headers: {
					'X-FT-Content-Classification': 'conditional_registered'
				}
			},
			// unconditional blog
			'/166b39cd-ad97-399d-9e84-402dcce5a1c0': {
				status: 200,
				headers: {
					'X-FT-Content-Classification': 'unconditional'
				}
			},
			// conditional standard blog
			'/4b3f14b6-344e-11e5-bdbb-35e55cbae175': {
				status: 200,
				headers: {
					'X-FT-Content-Classification': 'conditional_standard'
				}
			},
			// conditional registered blog
			'/a0c29efb-09a5-3ab4-a624-518d16c54c4b': {
				status: 200,
				headers: {
					'X-FT-Content-Classification': 'conditional_registered'
				}
			}
		}
	}
];
