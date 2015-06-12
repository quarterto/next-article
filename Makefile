API_KEY := $(shell cat ~/.ftapi 2>/dev/null)
API2_KEY := $(shell cat ~/.ftapi_v2 2>/dev/null)
GIT_HASH := $(shell git rev-parse --short HEAD)
GIT_LONG_HASH := $(shell git rev-parse HEAD)
TEST_HOST := "ft-article-branch-${GIT_HASH}"
TEST_URL := "http://ft-article-branch-${GIT_HASH}.herokuapp.com/fb368c7a-c804-11e4-8210-00144feab7de"
ELASTIC_SEARCH_HOST := $(shell cat ~/.elastic_search_host 2>/dev/null)

.PHONY: test

install:
	obt install --verbose

test: build-production unit-test verify

verify:
	nbt verify

unit-test:
	export PORT=${PORT}; export apikey=12345; export api2key=67890; export ELASTIC_SEARCH_HOST=ft-elastic-search.com; export NODE_ENV=test; mocha tests/server/ --recursive

test-debug:
	@mocha --debug-brk --reporter spec -i tests/server/

run:
ifeq ($(ELASTIC_SEARCH_HOST),)
	@echo "You need an elasticSearch url!  Speak to one of the next team to get one"
	exit 1
endif
ifeq ($(API_KEY),)
	@echo "You need an api key!  Speak to one of the next team to get one"
	exit 1
endif
ifeq ($(API2_KEY),)
	@echo "You need an api key for CAPI v2! Speak to one of the next team to get one"
	exit 1
endif
	export ELASTIC_SEARCH_HOST=${ELASTIC_SEARCH_HOST}; export apikey=${API_KEY}; export api2key=${API2_KEY}; export PORT=${PORT}; nbt run

build:
	nbt build --dev

build-production:
	nbt build

watch:
	nbt build --dev --watch

clean:
	git clean -fxd

deploy:
	nbt configure
	nbt deploy-hashed-assets
	nbt deploy
	nbt scale

visual:
	export TEST_HOST="${TEST_HOST}"; export GIT_LONG_HASH="${GIT_LONG_HASH}" ; export GIT_HASH="${GIT_HASH}"; node tests/visual/visualRunner.js -t page_setup.js

clean-deploy: clean install deploy

tidy:
	nbt destroy ${TEST_HOST}

provision:
	nbt provision ${TEST_HOST}
	nbt configure ft-next-article ${TEST_HOST} --overrides "NODE_ENV=branch,DEBUG=*"
	nbt deploy-hashed-assets
	nbt deploy ${TEST_HOST}
	make -j2 smoke visual

smoke:
	export TEST_URL=${TEST_URL}; nbt nightwatch tests/browser/tests/*
