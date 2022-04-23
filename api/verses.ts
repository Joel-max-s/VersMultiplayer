import { getBible, getLengthfromObject, getRandomNumber, spans } from "./utils";
import { BibleBook, chapterProps, PlaylistElem } from "./datatypes";

export class VerseHandler{
    bible : Array<BibleBook>;
    availableBooks: Array<number>;
    verse: {list: Array<number>, text: string} = {list: [-1, -1, -1], text: "Noch nix da"};
    timeBonus: number;
    playlistElems: IterableIterator<[number, PlaylistElem]>
    playlistActive: boolean = false

    constructor(avBooks: Array<number> = undefined, playL = undefined, playLActive = false) {
        this.bible = getBible();
        this.availableBooks = avBooks === undefined ? spans(0, getLengthfromObject(this.bible) -1) : avBooks;
        this.playlistElems = playL
        this.playlistActive = playLActive
        this.timeBonus = 0.5
    }

    setAvailableBooks(b : Array<number>) {
        this.availableBooks = b
    }

    generateVerse() {
        if (this.playlistActive) {
            const it = this.playlistElems.next()
            const nextElemisAvailable = !it.done
            if (nextElemisAvailable) {
                console.log(it.value[1])
                return this.generateVerseFromPlaylistElem(it.value[1])
            } else {
                this.playlistActive = false
                this.bible = getBible()
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

        return pe.time
    }

    toText(v : Array<number>) : string {
        return this.bible[v[0]].chapters[v[1]][v[2]];
    }

    stringifyverseList(v: Array<number>) {
        // TODO: evtl überprüfen ob der Array gültig ist
        return this.bible[v[0]].name + " " + (v[1] + 1).toString() + "," + (v[2] + 1).toString();
    }

    calculatePoints(is : Array<number>) {
        const indexI = this.getDistance(is);
        const indexS = this.getDistance(this.verse.list);
        const distance = Math.abs(indexI - indexS);
        const fistPossible = this.getDistance([this.availableBooks[0], 0, 0]);
        const lastBook = this.availableBooks[this.availableBooks.length - 1];
        const lastKap = this.bible[lastBook].chapters.length - 1;
        const lastVers = this.bible[lastBook].chapters[lastKap].length - 1;
        const lastPossible = this.getDistance([lastBook, lastKap, lastVers]);
        const distanceFirst = Math.abs(indexS - fistPossible);
        const distanceLast = Math.abs(lastPossible - indexS);
        const biggestPossibleDistance = distanceFirst > distanceLast ? distanceFirst : distanceLast;
        const weight = 4000 / biggestPossibleDistance;
        const pointsWithoutBonus = 4000 - (weight * distance);
        const pointsWithBonus = (distance == 0) ? pointsWithoutBonus * (1.5 + (2 * this.timeBonus)) : pointsWithoutBonus * (0.5 + this.timeBonus);
        const pointsRounded = Math.ceil(pointsWithBonus);
        this.timeBonus = (distance == 0) ? this.timeBonus * 0.7 : this.timeBonus;
        return ({ abstand: distance, punkte: pointsRounded });
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