"use strict";
exports.__esModule = true;
var utils_1 = require("./utils");
var bible = (0, utils_1.getBible)();
// console.log(bible)
var smallBible = [];
for (var _i = 0, bible_1 = bible; _i < bible_1.length; _i++) {
    var book = bible_1[_i];
    var chap = [];
    for (var _a = 0, _b = book.chapters; _a < _b.length; _a++) {
        var c = _b[_a];
        chap.push(c.length);
    }
    var temp = {
        name: book.name,
        chapterLength: chap
    };
    smallBible.push(temp);
}
console.log(smallBible);
console.log(bible);
