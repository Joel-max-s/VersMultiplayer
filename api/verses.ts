import { getBible, getLengthfromObject, getRandomNumber, spans } from "./utils";
import { BibleBook, chapterProps, PlaylistElem } from "./datatypes";

export class VerseHandler{
    bible : Array<BibleBook>;
    availableBooks: Array<number>;
    verse: {list: Array<number>, text: string};
    timeBonus: number;
    playlist: IterableIterator<[number, PlaylistElem]>
    playlistActive: boolean = false

    constructor(avBooks: Array<number> = undefined, playL = undefined, playLActive = false) {
        this.bible = getBible();
        this.availableBooks = avBooks === undefined ? spans(0, getLengthfromObject(this.bible) -1) : avBooks;
        this.playlist = playL
        this.playlistActive = playLActive
    }

    setAvailableBooks(b : Array<number>) {
        this.availableBooks = b
    }

    generateVerse() {
        if (this.playlistActive) {
            const it = this.playlist.next()
            const nextElemisAvailable = !it.done
            if (nextElemisAvailable) {
                console.log(it.value[1])
                this.generateVerseFromPlaylistElem(it.value[1])
                return
            } else {
                this.playlistActive = false
            }
        }
        console.log(this.playlistActive)
        this.generateVerseWithoutPlaylist()
    }

    private generateVerseWithoutPlaylist(options: {config: Array<number>} = {config: this.availableBooks}) {
        const book : number = options.config[getRandomNumber(options.config.length)];
        const chapter : number = getRandomNumber(getLengthfromObject(this.bible[book].chapters));
        const verse : number = getRandomNumber(getLengthfromObject(this.bible[book].chapters[chapter]));
        const verseAsList : Array<number> = [book, chapter, verse];
        const versString : string = this.toText(verseAsList)
        // return {list : verseAsList, text: versString}
        this.verse = {list : verseAsList, text: versString}
    }

    private generateVerseFromPlaylistElem(pe : PlaylistElem) {
        const selection = pe.selection[getRandomNumber(pe.selection.length)]
        const book : number = selection.book
        const chapterSelection = selection.chapters ? selection.chapters[getRandomNumber(selection.chapters.length)] : undefined
        const chapter = chapterSelection ? chapterSelection.chapter : 
            getRandomNumber(getLengthfromObject(this.bible[book].chapters))
        const verseSelection = chapterSelection ? chapterSelection.verses : undefined
        const verse : number = verseSelection ? verseSelection[getRandomNumber(verseSelection.length)] :
            getRandomNumber(getLengthfromObject(this.bible[book].chapters[chapter]))
        
        const verseAsList : Array<number> = [book, chapter, verse];
        const versString : string = this.toText(verseAsList)
        this.verse = {list : verseAsList, text: versString}
    }

    toText(v : Array<number>) : string {
        return this.bible[v[0]].chapters[v[1]][v[2]];
    }

    stringifyverseList(v: Array<number>) {
        // TODO: evtl überprüfen ob der Array gültig ist
        return this.bible[v[0]].name + " " + (v[1] + 1).toString() + "," + (v[2] + 1).toString();
    }

    calculatePoints(is : Array<number>) {
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
    }

    public generateBibleProps() : Array<chapterProps> {
        let bibleProps = []
        for(let book of this.bible) {
            let chap = []
            for(let c of book.chapters) {
                chap.push(c.length)
            }
            const temp = {
                name: book.name,
                chapterLength: chap
            }
            bibleProps.push(temp)
        }
        return bibleProps
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