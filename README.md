# Next Dobi [![Build Status](https://travis-ci.org/Financial-Times/next-dobi.svg?branch=master)](https://travis-ci.org/Financial-Times/next-dobi)

Dobi-III is the third and the last plane from Dobi line of aircraft designed by Lithuanian aviator [Jurgis Dobkevičius](http://en.wikipedia.org/wiki/Jurgis_Dobkevi%C4%8Dius). On June 8, 1926 it crashed at Kaunas Aerodrome killing its designer.

![](http://upload.wikimedia.org/wikipedia/commons/6/6e/Jurgis_Dobkevi%C4%8Dius.jpg)

## Installation

```
git clone https://github.com/Financial-Times/next-dobi.git
npm install
```

## Run

```
make run
```

## Known issues

### Images don't load

In order for images to load you need to be using a subdomain of `ft.com`.  For localhost development, the recommendation is mapping `localhost.ft.com` to `127.0.0.1`.  It will be broken on herokuapp.com for now.  Track the progress of the underlying issue here:- https://redmine.labs.ft.com/issues/48232.
