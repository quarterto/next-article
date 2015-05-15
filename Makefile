API_KEY := $(shell cat ~/.ftapi 2>/dev/null)
API2_KEY := $(shell cat ~/.ftapi_v2 2>/dev/null)
GIT_HASH := $(shell git rev-parse --short HEAD)
TEST_HOST := "ft-grumman-branch-${GIT_HASH}"
TEST_URL := "http://ft-grumman-branch-${GIT_HASH}.herokuapp.com/fb368c7a-c804-11e4-8210-00144feab7de"
ELASTIC_SEARCH_HOST := $(shell cat ~/.elastic_search_host 2>/dev/null)

.PHONY: test

install:
	origami-build-tools install --verbose

test: build-production
	nbt verify
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

tidy:
	nbt destroy ${TEST_HOST}

provision:
	nbt provision ${TEST_HOST}
	nbt configure ft-next-grumman-v002 ${TEST_HOST} --overrides "NODE_ENV=branch,DEBUG=*"
	nbt deploy-hashed-assets
	nbt deploy ${TEST_HOST}
	make smoke

smoke:
	export TEST_URL=${TEST_URL}; nbt nightwatch tests/browser/tests/*

update-flags:
	 curl http://next.ft.com/__flags.json > tests/fixtures/flags.json
