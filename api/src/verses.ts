import { getBible, getLengthfromObject, getRandomNumber, spans } from "./utils";
import { BibleBook, chapterProps, PlaylistElem } from "./datatypes";
import e from "express";

export class VerseHandler{
    bible : Array<BibleBook>;
    availableBooks: Array<number>;
    verse: {list: Array<number>, text: string} = {list: [-1, -1, -1], text: "Noch nix da"};
    timeBonus: number;
    currentPlaylistElem: PlaylistElem
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

    // if playlist available:
        // returns time and the available selections a user can make
    generateVerse() {
        if (this.playlistActive) {
            const it = this.playlistElems.next()
            const nextElemisAvailable = !it.done
            if (nextElemisAvailable) {
                this.currentPlaylistElem = it.value[1]
                return {
                    time: this.generateVerseFromPlaylistElem(this.currentPlaylistElem),
                    available : this.currentPlaylistElem.available
                }
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

    calculatePoints(is : Array<number>) : {abstand: number, punkte: number} {
        const distanceIs = this.getDistance(is);
        const distanceShould = this.getDistance(this.verse.list);
        const distance = Math.abs(distanceIs - distanceShould);

        if (this.playlistActive) {
            
        } else {

        }

        const fistPossible = this.getDistance([this.availableBooks[0], 0, 0]);
        const lastBook = this.availableBooks[this.availableBooks.length - 1];
        const lastKap = this.bible[lastBook].chapters.length - 1;
        const lastVers = this.bible[lastBook].chapters[lastKap].length - 1;
        const lastPossible = this.getDistance([lastBook, lastKap, lastVers]);
        const distanceFirst = Math.abs(distanceShould - fistPossible);
        const distanceLast = Math.abs(lastPossible - distanceShould);
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

    // TODO: look again into it
    private getDistance(verse: Array<number>) {
        const currentElem = this.currentPlaylistElem.available.sort((a,b) => a.book - b.book);
        const bookIndex = this.playlistActive ? currentElem.findIndex(e => e.book == verse[0]) : verse[0]
        const bookNumber = this.playlistActive ? currentElem[bookIndex].book : bookIndex

        let distance = 0;

        for(let i = 0; i < bookIndex; i++) {
            if (this.playlistActive && currentElem[i].chapters) {
                currentElem[i].chapters.forEach(c => {
                    distance += c.verses ? 
                        c.verses.length : 
                        this.bible[currentElem[i].book].chapters[c.chapter].length
                })
            } else {
                const currentBook = this.playlistActive ? currentElem[i].book : i
                this.bible[currentBook].chapters.forEach(c => {
                    distance += c.length;
                });
            }
        }

        if (this.playlistActive && currentElem[bookIndex].chapters) {
            const currentChapterElem = currentElem[bookIndex].chapters
            const chapterIndex = currentChapterElem.findIndex(e => e.chapter == verse[1])

            for(let i = 0; i < chapterIndex; i++) {
                distance += currentChapterElem[i].verses ?
                    currentChapterElem[i].verses.length :
                    this.bible[bookNumber].chapters[currentChapterElem[i].chapter].length;
            }

            distance += currentChapterElem[chapterIndex].verses ?
                currentChapterElem[chapterIndex].verses.findIndex(v => v == verse[2]) :
                verse[2]

            return distance
        } 
        
        for(let i = 0; i <= verse[1]; i++) {
            distance += i == verse[1] ? 
                verse[2] :
                this.bible[bookNumber].chapters[i].length;
        }
        return distance
    }
}