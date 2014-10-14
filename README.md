# Next Dobi [![Build Status](https://travis-ci.org/Financial-Times/next-dobi.svg?branch=master)](https://travis-ci.org/Financial-Times/next-dobi)

Dobi-III is the third and the last plane from Dobi line of aircraft designed by Lithuanian aviator [Jurgis Dobkevičius](http://en.wikipedia.org/wiki/Jurgis_Dobkevi%C4%8Dius). On June 8, 1926 it crashed at Kaunas Aerodrome killing its designer.

![](http://upload.wikimedia.org/wikipedia/commons/6/6e/Jurgis_Dobkevi%C4%8Dius.jpg)

## Installation

```
git clone https://github.com/Financial-Times/next-dobi.git
npm install
```

## Dependencies

Please install `next-router` globally.

## Run

Just run dobi on its own (localhost:3001):

```
make run-local
```

Run dobi through the router (localhost:5050):

```
make run
```

## HACK

Note origami-build-tools isn't compatible with all versions of SASS.  If you are getting errors (particularly with SASS 3.4) try running `bundle install` within this directory and prefixing all commands with `bundle exec`, e.g. `bundle exec make build`.
