"use strict";
exports.__esModule = true;
exports.VerseHandler = void 0;
var utils_1 = require("./utils");
var VerseHandler = /** @class */ (function () {
    function VerseHandler(avBooks, playL, playLActive) {
        if (avBooks === void 0) { avBooks = undefined; }
        if (playL === void 0) { playL = undefined; }
        if (playLActive === void 0) { playLActive = false; }
        this.playlistActive = false;
        this.bible = (0, utils_1.getBible)();
        this.availableBooks = avBooks === undefined ? (0, utils_1.spans)(0, (0, utils_1.getLengthfromObject)(this.bible)) : avBooks;
    }
    VerseHandler.prototype.setAvailableBooks = function (b) {
        this.availableBooks = b;
    };
    VerseHandler.prototype.generateVerse = function (options) {
        if (options === void 0) { options = { config: this.availableBooks }; }
        var book = options.config[(0, utils_1.getRandomNumber)(options.config.length)];
        var chapter = (0, utils_1.getRandomNumber)((0, utils_1.getLengthfromObject)(this.bible[book].chapters));
        var verse = (0, utils_1.getRandomNumber)((0, utils_1.getLengthfromObject)(this.bible[book].chapters[chapter]));
        var verseAsList = [book, chapter, verse];
        var versString = this.toText(verseAsList);
        // return {list : verseAsList, text: versString}
        this.verse = { list: verseAsList, text: versString };
    };
    VerseHandler.prototype.toText = function (v) {
        return this.bible[v[0]].chapters[v[1]][v[2]];
    };
    VerseHandler.prototype.stringifyverseList = function (v) {
        return this.bible[v[0]].name + " " + (v[1] + 1).toString() + "," + (v[2] + 1).toString();
    };
    VerseHandler.prototype.calculatePoints = function (is) {
        var indexI = this.getDistance(is);
        var indexS = this.getDistance(this.verse.list);
        var distance = Math.abs(indexI - indexS);
        var fistPossible = this.getDistance([this.availableBooks[0], 0, 0]);
        var lastBook = this.availableBooks[this.availableBooks.length - 1];
        var lastKap = this[lastBook].chapters.length - 1;
        var lastVers = this.bible[lastBook].chapters[lastKap].length - 1;
        var LastPossible = this.getDistance([lastBook, lastKap, lastVers]);
        var distanceFirst = Math.abs(indexS - fistPossible);
        var distanceLast = Math.abs(LastPossible - indexS);
        var biggestPossibleDistance = distanceFirst > distanceLast ? distanceFirst : distanceLast;
        var weight = 4000 / biggestPossibleDistance;
        var points = 4000 - (weight * distance);
        points = (distance == 0) ? points * (1.5 + (2 * this.timeBonus)) : points * (0.5 + this.timeBonus);
        points = Math.ceil(points);
        this.timeBonus = (distance == 0) ? this.timeBonus * 0.7 : this.timeBonus;
        return ({ abstand: distance, punkte: points });
    };
    VerseHandler.prototype.getDistance = function (verse) {
        var distance = 0;
        for (var i = 0; i <= verse[0]; i++) {
            if (i == verse[0]) {
                for (var j = 0; j <= verse[1]; j++) {
                    if (j == verse[1]) {
                        distance += verse[2];
                    }
                    else {
                        distance += this.bible[i].chapters[j].length;
                    }
                }
            }
            else {
                for (var j = 0; j < this.bible[i].chapters.length; j++) {
                    distance += this.bible[i].chapters[j].length;
                }
            }
        }
        return distance;
    };
    return VerseHandler;
}());
exports.VerseHandler = VerseHandler;
