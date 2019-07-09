'use strict';

var mysql = require('mysql');

var _this;

function DbAccess() {
    // contructor

    this.connection = mysql.createConnection({
        host: 'Enter',
        user: 'Database',
        password: 'Credentials',
        database: 'Here'
    });

    this.connection.connect();

    _this = this;
}

DbAccess.prototype.connection = {};

DbAccess.prototype.selectQuery = function selectQuery() {
    this.connection.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
        if (error) throw error;
        console.log('The solution is: ', results[0].solution);
    });
}

DbAccess.prototype.getDateStamp = function getDateStamp() {
    var d = new Date(Date.now());

    var datestring = d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2) + " " +
        ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2) + ":" + ("0" + d.getSeconds()).slice(-2);

    return datestring;
}

DbAccess.prototype.setCisternPublicPumpActive = function setCisternPublicPumpActive(cisternId, active, callback) {
    var bool = 0;
    if (active) {
        bool == 1
    }
    ;

    var sql = "UPDATE `cistern` SET `pump_public_active`=" + bool + " WHERE id=" + cisternId;
    this.connection.query(sql, function (error, results, fields) {

        if (error) {
            callback(true, null);
        } else {
            callback(false, true);
        }
    });
}


DbAccess.prototype.getAllCisternOrderByCluster4Json = function getAllCisternOrderByCluster4Json(callback) {

    let json = {};
    let x = this.getAllCluster((err, ret) => {
        if (!err) {
            let cluster = ret;
            /*
                        cluster.forEach(function (data) {
                            arr_cluster[data.id] = [];
                        });
            */
            //SQL Um ALle Cisternen zubekommen
            var sql = "SELECT * FROM cistern WHERE 1 ORDER BY cluster_id ASC";
            this.connection.query(sql, function (error, results, fields) {

                if (error) {
                    callback(true, error);
                } else {
                    //Daten in die Json einbinden
                    let cisterne = [];
                    results.forEach(function (data) {
                        var tempObject = {};
                        tempObject.id = data.id;
                        tempObject.name = data.name;
                        tempObject.volume = data.volume;
                        tempObject.fill_level = data.fill_level;
                        tempObject.pump_active = data.pump_public_active;
                        tempObject.cluster_id = data.cluster_id;
                        tempObject.prognose = [5015, 4918, 4716, 4618, 4620, 4620, 4600, 4500, 4508, 4444, 4321, 4200];
                        cisterne.push(tempObject);
                    });

                    cisterne.forEach(function (data) {
                        var clusterName = cluster[data.cluster_id - 1].name;
                        if (json[clusterName] === undefined) {
                            // console.log(json[clusterName]);
                            json[clusterName] = [];
                            //if (json[clusterName][] === undefined) {
                            json[clusterName].push(data);
                            // }
                        } else {
                            // if (json[clusterName][] === undefined) {
                            json[clusterName].push(data);
                            //}
                        }


                    });
                    callback(false, json);
                }
            });
        }
    });

}

DbAccess.prototype.getCisternRainArea = function getCisternRainArea(cisternId, callback) {
    var sql = "SELECT `rain_area` FROM `cistern` WHERE `id` = " + cisternId;
    this.connection.query(sql, function (error, results, fields) {

        if (error) {
            callback(true, null);
        } else {
            callback(false, results[0].rain_area);
        }
    });
}
DbAccess.prototype.setCisternLevel = function setCisternLevel(cisternId, level, callback) {
    var sql = "UPDATE `cistern` SET `fill_level`=" + level + ",`fill_level_time`='" + this.getDateStamp() + "' WHERE id=" + cisternId;
   // console.log(sql);
    this.connection.query(sql, function (error, results, fields) {

        if (error) {
            callback(true, null);
        } else {
            callback(false, true);
        }
    });
}
DbAccess.prototype.getCisternLevel = function getCisternLevel(cisternId, callback) {
    var sql = "SELECT `fill_level` FROM `cistern` WHERE `id` = " + cisternId;
    this.connection.query(sql, function (error, results, fields) {

        if (error) {
            callback(true, null);
        } else {
            callback(false, results[0].fill_level);
        }
    });
}
DbAccess.prototype.getCisternVolume = function getCisternVolume(cisternId, callback) {
    var sql = "SELECT volume FROM `cistern` WHERE `id` = " + cisternId;
    this.connection.query(sql, function (error, results, fields) {

        if (error) {
            callback(true, null);
        } else {
            callback(false, results[0].volume);
        }
    });
}
DbAccess.prototype.getPumpPublic = function getPumpPublic(cisternId, callback) {
    var sql = "SELECT `pump_public`FROM `cistern` WHERE `id`=" + cisternId;
   // console.log(sql);
    this.connection.query(sql, function (error, results, fields) {

        if (error) {
            callback(true, null);
        } else {
            callback(false, results[0].pump_public);
        }
    });
}
DbAccess.prototype.getPumpPrivate = function getPumpPrivate(cisternId, callback) {
    var sql = "SELECT `pump_private` FROM `cistern` WHERE `id`=" + cisternId;
    //console.log(sql);
    this.connection.query(sql, function (error, results, fields) {

        if (error) {
            callback(true, null);
        } else {
            // console.log(results);
            callback(false, results[0].pump_private);
        }
    });
}

DbAccess.prototype.getPumpCapacity = function getPumpCapacity(cisternId, isPrivate, callback) {
    var sql = "SELECT `" + (isPrivate ? "pump_private" : "pump_public") + "` AS `pump_id` FROM `cistern` WHERE `id`=" + cisternId;

    this.connection.query(sql, function (err, results, fields) {
        if (err) {
            callback(err, null);
        } else {
            var pumpId = results[0].pump_id;
            sql = "SELECT `capacity` FROM `pump` WHERE `id`=" + pumpId;

            _this.connection.query(sql, function (err, results, fields) {
                if (err) {
                    callback(err, null);
                } else {
                    var cap = results[0].capacity;

                    callback(false, cap);
                }
            });
        }
    });
}

DbAccess.prototype.addPumpEvent = function addPumpEvent(cisternId, volume, isPrivatePump, callback) {

    let pumpId;
    if (isPrivatePump == 0) {
        this.getPumpPublic(cisternId, (err, ret) => {
            if (!err) {
                pumpId = ret;
                var sql = "INSERT INTO `pumpEvent`(`pump_id`, `time`, `volume`) VALUES (" + pumpId + ",'" + this.getDateStamp() + "'," + volume + ")";
                this.connection.query(sql, function (error, results, fields) {

                    if (error) {
                        callback(true, null);
                    } else {
                        callback(false, true);
                    }
                });
            }
        });
    } else {
        this.getPumpPrivate(cisternId, (err, ret) => {
            if (!err) {
                //console.log(ret);
                pumpId = ret;
                var sql = "INSERT INTO `pumpEvent`(`pump_id`, `time`, `volume`) VALUES (" + pumpId + ",'" + this.getDateStamp() + "'," + volume + ")";
                this.connection.query(sql, function (error, results, fields) {

                    if (error) {
                        callback(true, null);
                    } else {
                        callback(false, true);
                    }
                });
            }
        });
    }
}

DbAccess.prototype.getAllCluster = function getAllCluster(callback) {
    var sql = "SELECT * FROM `cluster` WHERE 1";
    this.connection.query(sql, function (error, results, fields) {

        if (error) {
            callback(true, null);
        } else {
            callback(false, results);
        }
    });
}

DbAccess.prototype.getPumpEvents = function getPumpEvents(pumpId,callback){
    var sql= "SELECT DATE(time) as date,SUM(`volume`) as liter FROM `pumpEvent` WHERE `pump_id`="+pumpId+" GROUP BY DATE(time)";
    this.connection.query(sql, function (error, results, fields) {

        if (error) {
            callback(true, null);
        } else {
            callback(false, results);
        }
    });
}


DbAccess.prototype.selectCisternWithId = function selectCisternWithId(id, callback) {

    let json = new Object();

    var sql = "SELECT * FROM `cistern` WHERE `id` = " + id;
    this.connection.query(sql, function (error, results, fields) {

        if (error) {
            callback(true, null);
        } else {
            json.id = id;
            json.name = results[0].name;
            json.fuellstand = results[0].fill_level;
            json.img = "https://raw.githubusercontent.com/Cantaa/osh/master/bilder/" + Math.round(json.fuellstand / 1000) * 1000 + ".jpg";

            _this.getPumpEvents(results[0].pump_private,(err,ret)=>{
                json.verbrauch = ret;
                callback(false, json);
            });
        }
    });
}


DbAccess.prototype.end = function end() {
    this.connection.end();
}

module.exports = DbAccess;
