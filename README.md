# Next Article [![Circle CI](https://circleci.com/gh/Financial-Times/next-article/tree/master.svg?style=svg)](https://circleci.com/gh/Financial-Times/next-article/tree/master)

## Installation

```
git clone https://github.com/Financial-Times/next-article.git
cd next-article
make install
make build
```

## Dependencies

Please install [`next-router`](http://git.svc.ft.com/projects/NEXT/repos/router/browse) globally.

Next article also requires the [libxslt](http://xmlsoft.org/libxslt/) C library - and more specifically its [processing tool](http://xmlsoft.org/XSLT/xsltproc2.html). See the [XSLT section](#xslt) below for more information.

Next article also requires a PEM-formatted private key for signing purposes. This private key is not included in the repository, instead the path to where the private key is to be located in the file system is stored within the `.env` file at the root of this repo. This file is ignored from git. The key Next-Article looks for is `PRIVATE_KEY_PATH`.

An example `.env` file:
```bash
PRIVATE_KEY_PATH=~/keys/ft/url_sharing/private.key.pem
```

## Run

Run article through the router (localhost:5050):

```
make run
```

## CAPI V1 vs. V2

We aim to remove our dependency on the old Content API (v1) by the end of June.  Please don't create features that depend on features in V1 that have not been scheduled for V2.  [Please see the Content Programme roadmap for more details](https://docs.google.com/a/ft.com/presentation/d/1e711m8jZaBQ_CzLxhS7_1B3o015yVEmCiAni95zAPOg/edit#slide=id.p).  When using any feature from V1 please add a `TODO` for its replacement.

## XSLT

### Local install

If you're a Mac user you can install libxslt with [Homebrew](http://brew.sh/), just run `brew update && brew install libxslt`. If you're into Linux then the libxslt package is also available through Aptitude, Yum, RPM etc.

### Heroku

We include a precompiled binary for Heroku in this repo. Because we don't use [buildpacks](https://devcenter.heroku.com/articles/buildpacks) pre-installing dependencies is not an option. Creating a new binary is relatively straightforward - download source, unpack, compile and pack up the result:

```sh
heroku run bash --app <app-name>
$ curl http://xmlsoft.org/sources/libxslt-1.1.28.tar.gz -o /tmp/libxslt.tar.gz
$ tar -C /tmp -xvf /tmp/libxslt.tar.gz
$ cd /tmp/libxslt-1.1.28
$ ./configure --prefix=/app/libxslt && make && make install
$ tar -cvzf /app/heroku-libxslt.tar.gz /app/libxslt/bin/
$ scp /app/heroku-libxslt.tar.gz send@the:file/somewhere
```

Only the `xsltproc` binary is required.
