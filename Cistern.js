'use strict';

function Cistern(db, weather, cisternId) {
    // contructor
    this.db = db;
    this.weather = weather;
    this.cisternId = cisternId;

    var _this = this;


    setInterval(() => {

        if (_this.liveLevelMeasureStart) {
    
            _this.getCurrentDeltaFactor((err, obj) => {
                if (!err) {
                    var deltaFactor = obj;
    
                    _this.getLevel((err, obj) => {
                        if (!err) {
                            var oldLevel = obj;
                            var deltaTimeMs = Date.now() - _this.liveLevelMeasureStart;
            
                            var deltaVolume = deltaFactor * (deltaTimeMs / (1000 * 60 * 60));
            
                            var newVolume = oldLevel + deltaVolume;

                            _this.setLevel(newVolume);
                            _this.liveLevelMeasureStart = Date.now();
                        } else {
                            _this.liveLevelMeasureStart = Date.now();
                        }
                    });
                }
            });
        } else {
            _this.liveLevelMeasureStart = Date.now();
        }
    }, 20 * 1000);


};


Cistern.prototype.privatePumpActive = false;
Cistern.prototype.publicPumpActive = false;
Cistern.prototype.currentRainMmPerHour = 0.0;

Cistern.prototype.pumpHandlerIntervalIds = ["priv", "pub"];
Cistern.prototype.pumpHandlerMeasureStart = ["priv", "pub"];

Cistern.prototype.liveLevelMeasureStart = null;







// pump event alle 5 mins
Cistern.prototype.pumpHandler = function pumpHandler(isPrivatePump, newActive) {

    var currentActive = isPrivatePump ? this.privatePumpActive : this.publicPumpActive;

    this.getPumpCapacity(isPrivatePump, (err, obj) => {
        var literPerSecond = obj;

        if (newActive && !currentActive) {

            this.pumpHandlerMeasureStart[isPrivatePump] = Date.now();
            this.pumpHandler[isPrivatePump] = setInterval(() => {
    
                var timeSeconds = (Date.now() - this.pumpHandlerMeasureStart[isPrivatePump]) / 1000;
                var volume = literPerSecond * timeSeconds;
                this.addPumpEvent(volume, isPrivatePump);
                this.pumpHandlerMeasureStart[isPrivatePump] = Date.now();
    
            }, 5 * 60* 1000); // 5 min
    
        } else if (!newActive && currentActive) {
            clearInterval(this.pumpHandler[isPrivatePump]);
            
            var timeSeconds = (Date.now() - this.pumpHandlerMeasureStart[isPrivatePump]) / 1000;
            var volume = literPerSecond * timeSeconds;
            this.addPumpEvent(volume, isPrivatePump);
            this.pumpHandlerMeasureStart[isPrivatePump] = null;
        }
    
        if (isPrivatePump) {
            this.privatePumpActive = newActive;
        } else {
            this.publicPumpActive = newActive;
        }

    });
}


Cistern.prototype.setPrivatePumpStatus = function setPrivatePumpStatus(active) {
    this.pumpHandler(true, active);
}

Cistern.prototype.activatePublicPump = function activatePublicPump(destinationLevel) {
    
    this.db.setCisternPublicPumpActive(this.cisternId, true, (err, obj) => {
        if (err) {
            console.error("Error at setCisternPublicPumpActive() : " + JSON.stringify(err));
        } else {
            this.pumpHandler(false, true);

            // deaktivieren wenn fertig
            setInterval(() => {
                this.getLevel((err, level) => {
                    if (!err) {
                        if (level <= destinationLevel) {
                            this.pumpHandler(false, false);
                        }
                    }
                });
            }, 10 * 1000);
        }
    });
}

Cistern.prototype.setRain = function setRain(mmPerHour) {
    this.currentRainMmPerHour = mmPerHour;
}

Cistern.prototype.getCurrentDeltaFactor = function getCurrentDeltaFactor(callback) {
    // liter per hour
    var deltaFactor = 0.0;

    this.getPumpCapacity(true, (err, obj) => {
        var privateCapacity = obj;

        this.getPumpCapacity(false, (err, obj) => {
            var publicCapacity = obj;
    
            if (this.privatePumpActive) {
                deltaFactor -= privateCapacity * 60 * 60;
            }

            if (this.publicPumpActive) {
                deltaFactor -= publicCapacity * 60 * 60;
            }

            this.getRainArea((err, obj) => {
                if (!err) {
                    deltaFactor += this.currentRainMmPerHour * 1000 * obj;
                    callback(false, deltaFactor);
                } else {
                    callback(true, null);
                }
            });
        });
    });
}

Cistern.prototype.getRainArea = function getRainArea(callback) {
    this.db.getCisternRainArea(this.cisternId, (err, obj) => {
        if (err) {
            console.error("Error at getCisternRainArea() : " + JSON.stringify(err));
        }
        callback(err, obj);
    });
}

Cistern.prototype.setLevel = function setLevel(level) {
    
    this.db.setCisternLevel(this.cisternId, level, (err, obj) => {
        if (err) {
            console.error("Error at setCisternLevel() : " + JSON.stringify(err));
        }
    });
}

Cistern.prototype.getLevel = function getLevel(callback) {

    this.db.getCisternLevel(this.cisternId, (err, obj) => {
        if (err) {
            console.error("Error at getCisternLevel() : " + JSON.stringify(err));
        }
        callback(err, obj);
    });
}

Cistern.prototype.addPumpEvent = function addPumpEvent(volume, isPrivatePump) {
    this.db.addPumpEvent(this.cisternId, volume, isPrivatePump, (err, obj) => {
        if (err) {
            console.error("Error at addPumpEvent() : " + JSON.stringify(err));
        }
    });
}

Cistern.prototype.getPumpCapacity = function getPumpCapacity(isPrivatePump, callback) {
    this.db.getPumpCapacity(this.cisternId, isPrivatePump, (err, obj) => {
        if (err) {
            console.error("Error at getPumpCapacity() : " + JSON.stringify(err));
        }
        callback(err, obj);
    });
}


Cistern.prototype.getLevelForecast = function getLevelForecast(callback) {
    // Gaertnerentnahme vernachlässigbar
    // Regenprognose mm/h

    var _this = this;

    this.weather.getForecast("169819", (err, obj) => {
        if (err) {
            console.error("Error at getForecast() : " + JSON.stringify(err));
            callback(err, null);
        } else {
            var rain = obj;
            // Grundstücksgrösse
            _this.getRainArea((err, obj) => {
                if (err) {
                    console.error("Error at getRainArea() : " + JSON.stringify(err));
                    callback(err, null);
                } else { 
                    var rainArea = obj;
                    // Füllstand
                    _this.getLevel((err, obj) => {
                        if (err) {
                            console.error("Error at getLevel() : " + JSON.stringify(err));
                            callback(err, null);
                        } else {
                            var level = obj;
                            var retArr = [];
                            var futLevel = level;
                            rain.forEach((rainItem, index) => {
                                futLevel += rainItem.Value * rainArea;
                                retArr.push({
                                    DateTime: rainItem.DateTime,
                                    Level: futLevel,
                                    Rain: rainItem.Value
                                });
                            });
                            callback(false, retArr);
                        }
                    });
                }
            });
        }
    });
}


module.exports = Cistern;
