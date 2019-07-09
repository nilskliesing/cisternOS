'use strict';

var Cistern = require('./Cistern.js');

var _this;

function Core(db, weather) {
    _this = this;
    this.db = db;
    this.weather = weather;
}

Core.prototype.cisterns = {}


Core.prototype.run = function run() {
    // cisterns erzeugen
    
    for (var i=1; i<=25; i++) {
        this.cisterns[""+i] = new Cistern(this.db, this.weather, i);
    }


}

// Regen auf Simulation übertragen
setInterval(() => {

    _this.weather.getForecast("169819", (err, obj) => {
        if (err) {
            console.error("Error at getForecast() : " + JSON.stringify(err));
        } else {
            var rain = obj[0].Value;

            for (var attr in _this.cisterns) {
                var cistern = _this.cisterns[attr];
                cistern.setRain(rain);
            }
        }
    });
}, 60 * 1000);


// Not-Ablassung einleiten falls nötig
setInterval(() => {
    for (var attr in _this.cisterns) {
        var cistern = _this.cisterns[attr];
        
        cistern.getLevelForecast((err, obj) => {
            if (err) {
                console.error("Error at getLevelForecast() : " + JSON.stringify(err));
            } else {
                var levelArr = obj;
                var highestLevel = levelArr[levelArr.length - 1].Level;

                // get volume
                _this.db.getCisternVolume(attr, (err, obj) => {
                    if (err) {
                        console.error("Error at getCisternVolume() : " + JSON.stringify(err));
                    } else {
                        var volume = obj;

                        // ablassen einleiten wenn nötig
                        if (highestLevel > (volume * 0.9)) {
                            var destinationLevel = highestLevel - (volume * 0.9);
                            cistern.activatePublicPump(destinationLevel);
                        }
                    }
                });
            }
        });
    }
    
}, 60 * 1000);


// prognose on demand
Core.prototype.getLevelForecast = function getLevelForecast(cisternId, callback) {



    var cistern = this.cisterns[cisternId];

    console.log(cistern);

    if (!cistern) {
        callback(true, null);
    } else {
        cistern.getLevelForecast((err, obj) => {
            if (err) {
                console.error("Error at getLevelForecast() : " + JSON.stringify(err));
                callback(err, null);
            } else {
                var retArr = [];

                obj.forEach((item) => {
                    retArr.push({
                        Level: item.Level,
                        Rain: item.Rain
                    });
                });

                callback(false, retArr);
            }
        });
    }
}

module.exports = Core;
