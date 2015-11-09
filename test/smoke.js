module.exports = [
	{
		headers: {
			Cookie: 'next-flags=elasticSearchItemGet:on'
		},
		timeout: 10000,
		urls: {
			// not in CAPI (redirected to ft.com -> redirected to barrier)
			'/content/8f88c930-d00a-11da-80fb-0000779e2340': 'http://www.ft.com/cms/s/0/8f88c930-d00a-11da-80fb-0000779e2340.html?ft_site=falcon&desktop=true',
			//methode
			'/content/395650fa-5b9c-11e5-a28b-50226830d644': 200,
			//fastft
			'/content/b002e5ee-3096-3f51-9925-32b157740c98': 200,
			// related fragments
			'/article/02cad03a-844f-11e4-bae9-00144feabdc0/story-package?articleIds=b56232bc-adec-11e4-919e-00144feab7de,8a5c2c02-a47e-11e4-b943-00144feab7de,6bfcdc6e-a0b6-11e4-8ad8-00144feab7de,c0dbd6d6-8072-11e4-9907-00144feabdc0': 200,
			'/article/02cad03a-844f-11e4-bae9-00144feabdc0/more-on?tagId=TnN0ZWluX1BOX1BvbGl0aWNpYW5fMTY4OA==-UE4=': 200,
			// articles with not tagged with X
			'/article/a1fb6fee-93ae-359d-be8f-f215920b79ff/more-on?tagId=OA==-U2VjdGlvbnM=': {
				content: ''
			}
		}
	},
	{
		// Elastic V3
		headers: {
			Cookie: 'next-flags=elasticV3:on'
		},
		timeout: 10000,
		urls: {
			// Methode
			'/content/395650fa-5b9c-11e5-a28b-50226830d644': 200,
			// FastFT
			'/content/b002e5ee-3096-3f51-9925-32b157740c98': 200,
		}
	},
	{
		// Podcast
		headers: {
			Cookie: 'next-flags=elasticSearchItemGet:on'
		},
		timeout: 10000,
		urls: {
			'/content/55ef024ec7a00b32cb5a5991': 404
		}
	},
	{
		// test access
		timeout: 10000,
		headers: {
			'X-FT-Access-Metadata': 'remote_headers',
			Cookie: 'next-flags=elasticSearchItemGet:on'
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
