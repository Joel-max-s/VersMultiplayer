"use strict";
exports.__esModule = true;
exports.getLengthfromObject = exports.getBible = exports.getRandomNumber = void 0;
var fs = require("fs");
function getRandomNumber(max) {
    return Math.floor(Math.random() * Math.floor(max));
}
exports.getRandomNumber = getRandomNumber;
function getBible(bibleName) {
    var rawdata = (function () {
        switch (bibleName) {
            case "Schlachter": return fs.readFileSync("de_schlachter-min.json");
            default: return fs.readFileSync("de_schlachter-min.json");
        }
    })();
    return JSON.parse(rawdata.toString());
}
exports.getBible = getBible;
function getLengthfromObject(obj) {
    return Object.keys(obj).length;
}
exports.getLengthfromObject = getLengthfromObject;
