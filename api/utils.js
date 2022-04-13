"use strict";
exports.__esModule = true;
exports.generateBooksList = exports.spans = exports.getLengthfromObject = exports.getBible = exports.getRandomNumber = void 0;
var fs = require("fs");
var path = require("path");
function getRandomNumber(max) {
    return Math.floor(Math.random() * max);
}
exports.getRandomNumber = getRandomNumber;
function getBible(bibleName) {
    var biblePath = path.join(__dirname, 'bibles');
    var rawdata = (function () {
        switch (bibleName) {
            case "Schlachter": return fs.readFileSync(path.join(biblePath, 'de_schlachter.json'));
            default: return fs.readFileSync(path.join(biblePath, 'de_schlachter.json'));
        }
    })();
    return JSON.parse(rawdata.toString());
}
exports.getBible = getBible;
function getLengthfromObject(obj) {
    return Object.keys(obj).length;
}
exports.getLengthfromObject = getLengthfromObject;
function spans(i, j) {
    var list = [];
    for (var index = i; index <= j; index++) {
        list.push(index);
    }
    return list;
}
exports.spans = spans;
function generateBooksList(sel) {
    if (sel === void 0) { sel = ""; }
    switch (sel) {
        case "AT": return spans(0, 38);
        case "NT": return spans(39, 65);
        case "Tora": return spans(0, 4);
        case "geschichte": return spans(5, 16);
        case "Lehre": return spans(17, 21);
        case "Propheten": return spans(22, 38);
        case "gPropheten": return spans(22, 26);
        case "kPropheten": return spans(27, 38);
        case "Evangelien": return spans(39, 42);
        case "Apg": return spans(43, 43);
        case "paul": return spans(44, 56);
        case "aBriefe": return spans(57, 64);
        case "off": return spans(65, 65);
        default:
            return spans(0, 65);
    }
}
exports.generateBooksList = generateBooksList;
