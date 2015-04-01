# Next Grumman [![Build Status](https://travis-ci.org/Financial-Times/next-grumman.svg?branch=sentry-56122933)](https://travis-ci.org/Financial-Times/next-grumman)

## Installation

```
git clone https://github.com/Financial-Times/next-grumman.git
cd next-grumman
make install
make build
```

## Dependencies

Please install [`next-router`](http://git.svc.ft.com/projects/NEXT/repos/router/browse) globally.

## Run

Just run grumman on its own (localhost:3003):

```
make run-local
```

Run grumman through the router (localhost:5050):

```
make run
```

## CAPI V1 vs. V2

We aim to remove our dependency on the old Content API (v1) by the end of June.  Please don't create features that depend on features in V1 that have not been scheduled for V2.  [Please see the Content Programme roadmap for more details](https://docs.google.com/a/ft.com/presentation/d/1e711m8jZaBQ_CzLxhS7_1B3o015yVEmCiAni95zAPOg/edit#slide=id.p).  When using any feature from V1 please add a `TODO` for its replacement.
