module.exports = [
	{
		timeout: 5000,
		urls: {
			//methode
			'/content/395650fa-5b9c-11e5-a28b-50226830d644': 200,
			//fastft
			'/content/b002e5ee-3096-3f51-9925-32b157740c98': 200,
			// related fragments
			'/article/02cad03a-844f-11e4-bae9-00144feabdc0/story-package': 200,
			'/article/02cad03a-844f-11e4-bae9-00144feabdc0/more-on?metadata-fields=primaryTheme': 200,
			// articles with not tagged with X
			'/article/a1fb6fee-93ae-359d-be8f-f215920b79ff/more-on?metadata-fields=primaryTheme': {
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
			'/content/02cad03a-844f-11e4-bae9-00144feabdc0': 200
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
			'/content/b30c8de4-4754-11e5-af2f-4d6e0e5eda22': {
				status: 200,
				headers: {
					'X-FT-Content-Classification': 'conditional_standard'
				}
			},
			// unconditional article
			'/content/459ef70a-4a43-11e5-b558-8a9722977189': {
				status: 200,
				headers: {
					'X-FT-Content-Classification': 'unconditional'
				}
			},
			// conditional premium article
			'/content/fe857b82-4add-11e5-9b5d-89a026fda5c9': {
				status: 200,
				headers: {
					'X-FT-Content-Classification': 'conditional_premium'
				}
			},
			// fastft
			'/content/b002e5ee-3096-3f51-9925-32b157740c98': {
				status: 200,
				headers: {
					'X-FT-Content-Classification': 'conditional_standard'
				}
			},
			// alphaville
			'/content/06d867f9-37d0-3ea8-965e-34043575e607': {
				status: 200,
				headers: {
					'X-FT-Content-Classification': 'conditional_registered'
				}
			},
			// unconditional blog
			'/content/1be403ef-db18-38ad-b693-38913f3a1c24': {
				status: 200,
				headers: {
					'X-FT-Content-Classification': 'conditional_standard'
				}
			},
			// conditional standard blog
			'/content/4b3f14b6-344e-11e5-bdbb-35e55cbae175': {
				status: 200,
				headers: {
					'X-FT-Content-Classification': 'conditional_standard'
				}
			},
			// conditional registered blog
			'/content/a0c29efb-09a5-3ab4-a624-518d16c54c4b': {
				status: 200,
				headers: {
					'X-FT-Content-Classification': 'conditional_registered'
				}
			}
		}
	}
];
