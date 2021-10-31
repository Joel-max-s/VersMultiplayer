"use strict";
exports.__esModule = true;
exports.VerseHandler = void 0;
var utils_1 = require("./utils");
// generiert den zufälligen Vers
// export function vers({aktiv = true, config = gewaehlteBuecher} = {}) {
//     console.log(aktiv, config);
//     let Buchnummer = config[getRandomInt(config.length)];
//     let Kapitel = getRandomInt(Object.keys(my_JSON_object[Buchnummer].chapters).length);
//     let Vers = getRandomInt(Object.keys(my_JSON_object[Buchnummer].chapters[Kapitel]).length);
//     var tempList = [Buchnummer, Kapitel, Vers];
//     versAlsListe = aktiv ? tempList : versAlsListe;
//     var versS = toVers(tempList);
//     console.log(String(versS));
//     return { liste: tempList, text: versS };
// }
var VerseHandler = /** @class */ (function () {
    function VerseHandler() {
        this.bible = (0, utils_1.getBible)();
    }
    VerseHandler.prototype.generateVerse = function () {
        var book = (0, utils_1.getRandomNumber)((0, utils_1.getLengthfromObject)(this.bible));
        var chapter = (0, utils_1.getRandomNumber)((0, utils_1.getLengthfromObject)(this.bible[book].chapters));
        var verse = (0, utils_1.getRandomNumber)((0, utils_1.getLengthfromObject)(this.bible[book].chapters[chapter]));
        var verseAsList = [book, chapter, verse];
        var versString = this.toText(verseAsList);
        return { list: verseAsList, text: versString };
    };
    VerseHandler.prototype.toText = function (v) {
        return this.bible[v[0]].chapters[v[1]][v[2]];
    };
    return VerseHandler;
}());
exports.VerseHandler = VerseHandler;
