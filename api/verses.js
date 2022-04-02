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
        this.availableBooks = avBooks === undefined ? (0, utils_1.spans)(0, (0, utils_1.getLengthfromObject)(this.bible) - 1) : avBooks;
        this.playlist = playL;
        this.playlistActive = playLActive;
    }
    VerseHandler.prototype.setAvailableBooks = function (b) {
        this.availableBooks = b;
    };
    VerseHandler.prototype.generateVerse = function () {
        if (this.playlistActive) {
            var it = this.playlist.next();
            var nextElemisAvailable = !it.done;
            if (nextElemisAvailable) {
                console.log(it.value[1]);
                this.generateVerseFromPlaylistElem(it.value[1]);
                return;
            }
            else {
                this.playlistActive = false;
            }
        }
        console.log(this.playlistActive);
        this.generateVerseWithoutPlaylist();
    };
    VerseHandler.prototype.generateVerseWithoutPlaylist = function (options) {
        if (options === void 0) { options = { config: this.availableBooks }; }
        var book = options.config[(0, utils_1.getRandomNumber)(options.config.length)];
        var chapter = (0, utils_1.getRandomNumber)((0, utils_1.getLengthfromObject)(this.bible[book].chapters));
        var verse = (0, utils_1.getRandomNumber)((0, utils_1.getLengthfromObject)(this.bible[book].chapters[chapter]));
        var verseAsList = [book, chapter, verse];
        var versString = this.toText(verseAsList);
        // return {list : verseAsList, text: versString}
        this.verse = { list: verseAsList, text: versString };
    };
    VerseHandler.prototype.generateVerseFromPlaylistElem = function (pe) {
        var selection = pe.selection[(0, utils_1.getRandomNumber)(pe.selection.length)];
        var book = selection.book;
        var chapterSelection = selection.chapters ? selection.chapters[(0, utils_1.getRandomNumber)(selection.chapters.length)] : undefined;
        var chapter = chapterSelection ? chapterSelection.chapter :
            (0, utils_1.getRandomNumber)((0, utils_1.getLengthfromObject)(this.bible[book].chapters));
        var verseSelection = chapterSelection ? chapterSelection.verses : undefined;
        var verse = verseSelection ? verseSelection[(0, utils_1.getRandomNumber)(verseSelection.length)] :
            (0, utils_1.getRandomNumber)((0, utils_1.getLengthfromObject)(this.bible[book].chapters[chapter]));
        var verseAsList = [book, chapter, verse];
        var versString = this.toText(verseAsList);
        this.verse = { list: verseAsList, text: versString };
    };
    VerseHandler.prototype.toText = function (v) {
        return this.bible[v[0]].chapters[v[1]][v[2]];
    };
    VerseHandler.prototype.stringifyverseList = function (v) {
        // TODO: evtl überprüfen ob der Array gültig ist
        return this.bible[v[0]].name + " " + (v[1] + 1).toString() + "," + (v[2] + 1).toString();
    };
    VerseHandler.prototype.calculatePoints = function (is) {
        var indexI = this.getDistance(is);
        var indexS = this.getDistance(this.verse.list);
        var distance = Math.abs(indexI - indexS);
        var fistPossible = this.getDistance([this.availableBooks[0], 0, 0]);
        var lastBook = this.availableBooks[this.availableBooks.length - 1];
        var lastKap = this.bible[lastBook].chapters.length - 1;
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
    VerseHandler.prototype.generateBibleProps = function () {
        var bibleProps = [];
        for (var _i = 0, _a = this.bible; _i < _a.length; _i++) {
            var book = _a[_i];
            var chap = [];
            for (var _b = 0, _c = book.chapters; _b < _c.length; _b++) {
                var c = _c[_b];
                chap.push(c.length);
            }
            var temp = {
                name: book.name,
                chapterLength: chap
            };
            bibleProps.push(temp);
        }
        return bibleProps;
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
