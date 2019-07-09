'use strict';

var express = require('express');
var fs = require('fs');
var DbAccess = require('./DbAccess.js');
var WeatherAccess = require('./WeatherAccess.js');
var Cistern = require('./Cistern.js');
var Core = require('./Core.js');


var app = express();
var db = new DbAccess();
var weather = new WeatherAccess();
var core = new Core(db, weather);

core.run();



app.get('/', function (req, res) {
    res.send('Hello World!');
});

// Cistern specific data
app.get('/cistern/:cisternId', (req, res) => {
    var id = req.params.cisternId;


    db.selectCisternWithId(id, (err, ret) => {
        if (!err) {
            // console.log(ret);
            res.send(JSON.stringify(ret));
        } else {
            res.send(err);
        }
    });
});

// Data for whole city
app.get('/city', (req, res) => {

    db.getAllCisternOrderByCluster4Json((err, ret) => {
        if (!err) {


            var allData = ret;

            var count = 25;
            var i = 0;
            for (var cluster in allData) {
                var currentCluster = allData[cluster];

                currentCluster.forEach((cistern) => {
                    cistern.prognose = [];

                    core.getLevelForecast(cistern.id, (err, obj) => {

                        console.log("CB getLevelForecast ID " + cistern.id);

                        if (err) {
                            console.error("Error at getLevelForecast(): " + JSON.stringify(err));
                        } else {
                            cistern.prognose = obj;
                        }

                        i++;
                        if (i === count) {
                            res.send(allData);
                        }

                    });

                });
            }


        } else {
            res.send(err);
        }
    });
});

// Forecast data for all cisterns
app.get('/starkregen', (req, res) => {

    var retArr = Array(12);
    retArr.fill({full: 0, rain: 0});

    for (var i = 1; i<=25; i++) {
        core.getLevelForecast(i, (err, obj) => {
            retArr[i-1].full += obj.Level;
            retArr[i-1].rain += obj.Rain;

            if (i == 25) {
                res.send(retArr);
            }
        });
    }
});

app.use(express.static('bilder'));

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});
