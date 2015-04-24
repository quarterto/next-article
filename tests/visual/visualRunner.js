var page_data = require('./config/page_setup.js').testData;
var prod_data = require('./config/page_setup.js').productionData;

for(page in page_data){

    var testURL = "http://" + process.env.TEST_HOST + ".herokuapp.com";
    var prodHost = prod_data.host;
    var prodSuffix = prod_data.canary;
    var page_name = page_data[page].name;
    var page_path = page_data[page].path;
    var widths = collectWidths(page_data[page]);
    for(var x = 0; x < widths.length ; x++){
        var output = "";
        var width = widths[x];
        var elements = getAllElementsOnWidth(page_data[page],width);

        console.log("\n\nStarting test for.." +
        "\nPage name  : " + page_name +
        "\npath       : " + page_path +
        "\nwidth      : " + width +
        "\nheight     : 1000" +
        "\ntestURL    : " + testURL +
        "\nprodhost   : " + prodHost +
        "\nprodsuffix : " + prodSuffix +
        "\nelements " + JSON.stringify(elements));

        var spawn = require('child_process').spawn,
            run = spawn("casperjs",
                [
                    "--width=" + width,
                    "--height=1000",
                    "--pagename=" + page_name,
                    "--path=" + page_path,
                    "--elements=" + JSON.stringify(elements),
                    "--testurl=" + testURL,
                    "--prodhost=" + prodHost,
                    "--prodsuffix=" + prodSuffix,
                    "test","tests/visual/elements_test.js"
                ]);

        run.stdout.on('data', function(data){
            output += data;
        });

        run.stderr.on('data', function(data){
            output += data;
        });

        run.on('close', function(code){
            console.log(output);
            console.log('executed with code: ' + code);

            //TODO: output result data to Github (and make sure 'failures' don't stop the build)
        });
    }
}

function getAllElementsOnWidth(json,width){
    var elementObject = {};
    for(element in json.elements){
        element = json.elements[element];
        var widths = element.widths;
        if(widths.indexOf(width)==-1){
        }else{
            elementObject[element.name] = element.css;
            //elementsArray.push(JSON.parse('{"' + element.name + '":"' + element.css + '"}'));
        }
    }
    return elementObject;
}

function collectWidths(json){
    var compiledWidths = [];
    for(item in json.elements){
        var widths = json.elements[item].widths;
        for(var x = 0; x < widths.length ; x++){
            if(compiledWidths.indexOf(widths[x])==-1) {
                compiledWidths.push(widths[x]);
            }
        }
    }
    return compiledWidths;
}
