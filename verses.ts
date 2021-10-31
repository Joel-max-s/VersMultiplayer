import { getBible, getLengthfromObject, getRandomNumber } from "./utils";

export class VerseHandler{
    bible : object;

    constructor() {
        this.bible = getBible();
    }

    generateVerse() {
        const book : number = getRandomNumber(getLengthfromObject(this.bible));
        const chapter : number = getRandomNumber(getLengthfromObject(this.bible[book].chapters));
        const verse : number = getRandomNumber(getLengthfromObject(this.bible[book].chapters[chapter]));
        const verseAsList : Array<number> = [book, chapter, verse];
        const versString : string = this.toText(verseAsList)
        return {list : verseAsList, text: versString}
    }

    toText(v : Array<number>) : string {
        return this.bible[v[0]].chapters[v[1]][v[2]];
    }
}