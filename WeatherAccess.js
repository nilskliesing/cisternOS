'use strict';

var request = require('request');

function WeatherAccess() {
    // constructor
}

WeatherAccess.prototype.apiKey = "EnterAccuWeatherApiKeyHere";


WeatherAccess.prototype.getGeoKey = function getGeoKey(lat, lon, callback) {

    var url = "http://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=" + this.apiKey + "&q=" + lat + "%2C" + lon + "&language=de-de&details=true";


    request.get(url, {}, (err, resp) => {

        if (err) {
            callback(err, null);
        } else {
            if (resp && resp.body && resp.body !== "") {
                var arr = JSON.parse(resp.body);

                if (arr && arr.Key) {
                    callback(false, arr.Key);
                } else {
                    callback(true, null);
                }
            } else {
                callback(true, null);
            }
        }
    });
}

WeatherAccess.prototype.getForecast = function getForecast(geoKey, callback) {
    var url = "http://dataservice.accuweather.com/forecasts/v1/hourly/12hour/" + geoKey + "?apikey=" + this.apiKey + "&language=de-de&details=true&metric=true";

    request.get(url, {}, (err, resp) => {

        if (err) {
            callback(err, null);
        } else {
            if (resp && resp.body && resp.body !== "") {
                var arr = JSON.parse(resp.body);

                if (arr && Array.isArray(arr)) {
                    var retArr = [];

                    arr.forEach(val => {
                        if (val && val.Rain && val.Rain.Value !== undefined && val.DateTime) {
                            retArr.push({
                                DateTime: val.DateTime,
                                Value: val.Rain.Value
                            });
                        }
                    });


                    callback(false, retArr);
                    //console.log(retArr);
                } else {
                    callback(true, null);
                }
            } else {
                callback(true, null);
            }
        }
    });
}


module.exports = WeatherAccess;
