import { getBible, getLengthfromObject, getRandomNumber, spans } from "./utils";
import { PlaylistElem } from "./datatypes";

export class VerseHandler{
    bible : object;
    availableBooks: Array<number>;
    verse: {list: Array<number>, text: string};
    timeBonus: number;
    playlist: Array<PlaylistElem>
    playlistActive: boolean = false

    constructor(avBooks: Array<number> = undefined, playL = undefined, playLActive = false) {
        this.bible = getBible();
        this.availableBooks = avBooks === undefined ? spans(0, getLengthfromObject(this.bible)) : avBooks;
    }

    setAvailableBooks(b : Array<number>) {
        this.availableBooks = b
    }

    generateVerse(options: {config: Array<number>} = {config: this.availableBooks}) {
        const book : number = options.config[getRandomNumber(options.config.length)];
        const chapter : number = getRandomNumber(getLengthfromObject(this.bible[book].chapters));
        const verse : number = getRandomNumber(getLengthfromObject(this.bible[book].chapters[chapter]));
        const verseAsList : Array<number> = [book, chapter, verse];
        const versString : string = this.toText(verseAsList)
        // return {list : verseAsList, text: versString}
        this.verse = {list : verseAsList, text: versString}
    }

    toText(v : Array<number>) : string {
        return this.bible[v[0]].chapters[v[1]][v[2]];
    }

    stringifyverseList(v: Array<number>) {
        return this.bible[v[0]].name + " " + (v[1] + 1).toString() + "," + (v[2] + 1).toString();
    }

    calculatePoints(is : Array<number>, target: Array<number>, timeBonus : number) {
        var indexI = this.getDistance(is);
        var indexS = this.getDistance(target);
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
        points = (distance == 0) ? points * (1.5 + (2 * timeBonus)) : points * (0.5 + timeBonus);
        points = Math.ceil(points);
        timeBonus = (distance == 0) ? timeBonus * 0.7 : timeBonus;
        return ({ abstand: distance, punkte: points });
    }

    private getDistance(verse: Array<number>) {
        let distance : number = 0;
        for (var i = 0; i <= verse[0]; i++) {
            if (i == verse[0]) {
                for (var j = 0; j <= verse[1]; j++) {
                    if (j == verse[1]) {
                        distance += verse[2];
                    }
                    else {
                        distance += this.bible[i].chapters[j].length
                    }
                }
            }
            else {
                for (var j = 0; j < this.bible[i].chapters.length; j++) {
                    distance += this.bible[i].chapters[j].length
                }
            }
        }
        return distance;
    }
}