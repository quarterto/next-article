
"use strict";

// define each page you want to test, which elements you want to check on each page, and
// at which browser widths those elements should appear

exports.testData = {
    "article_with_image":{
        "name": "article_with_image",
        "path": "ccf7af08-e904-11e4-a71a-00144feab7de",
        "elements":{
            "header_logo": {
                "name":"header_logo",
                "css":'a[data-trackable=logo]',
                "widths":[
                    500,
                    1000,
                    1400
                ]
            },
            "mypage_button": {
                "name":"mypage_button",
                "css":'.next-header__primary-tools__mypage',
                "widths":[
                    500,
                    1000,
                    1200
                ]
            }
        }
    },
    "article_with_video":{
        "name": "article_with_video",
        "path":"05faa536-d3ab-11e4-a9d3-00144feab7de",
        "elements":{
            "header_logo": {
                "name":"header_logo",
                "css":'a[data-trackable=logo]',
                "widths":[
                    500,
                    1000,
                    1400
                ]
            }
        }
    }
};

// Define where this application's production code is going to live
// TODO: stop using canary and log in properly.
exports.productionData = {
    "app_name":"grumman",
    "host":"http://next.ft.com",
    "canary":"?canary=grumman:ft-next-grumman-v002.herokuapp.com"
};