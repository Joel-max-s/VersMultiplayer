import { getBible, getLengthfromObject, getRandomNumber } from "./utils";
import { BibleBook, BibleProps, chapterProps, PlaylistElem } from "./datatypes";

const TIME_BONUS_DECREASE_MULTIPLYER = 0.7

export class VerseHandler{
    bible : Array<BibleBook> = getBible();
    verse: {list: Array<number>, text: string} = {list: [-1, -1, -1], text: "Noch nix da"};
    timeBonus: number = 0.5;
    currentPlaylistElem?: PlaylistElem = undefined
    playlistElems?: IterableIterator<[number, PlaylistElem]>
    playlistActive: boolean = false

    // if playlist available:
        // returns time and the available selections a user can make
    generateVerse() {
        if (this.playlistActive && this.playlistElems) {
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

    private generateVerseWithoutPlaylist() {
        const book : number = this.bible.length;
        const chapter : number = getRandomNumber(getLengthfromObject(this.bible[book].chapters));
        const verse : number = getRandomNumber(getLengthfromObject(this.bible[book].chapters[chapter]));
        const verseAsList : Array<number> = [book, chapter, verse];
        const versString : string = this.toText(verseAsList)
        this.verse = {list : verseAsList, text: versString}
    }

    private generateVerseFromPlaylistElem(pe : PlaylistElem) : number {
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

        return pe.time ?? -1
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

        const fistPossible = this.getFirstPossible()
        const lastPossible = this.getLastPossible()
        const distanceFirst = Math.abs(distanceShould - fistPossible);
        const distanceLast = Math.abs(lastPossible - distanceShould);
        const biggestPossibleDistance = distanceFirst > distanceLast ? distanceFirst : distanceLast;

        const weight = 4000 / biggestPossibleDistance;
        const pointsWithoutBonus = 4000 - (weight * distance);
        const pointsWithBonus = (distance == 0) ? pointsWithoutBonus * (1.5 + (2 * this.timeBonus)) : pointsWithoutBonus * (0.5 + this.timeBonus);
        const pointsRounded = Math.ceil(pointsWithBonus);
        this.timeBonus = (distance == 0) ? this.timeBonus * TIME_BONUS_DECREASE_MULTIPLYER : this.timeBonus;
        return ({ abstand: distance, punkte: pointsRounded });
    }

    public generateBibleProps() : Array<chapterProps> {
        let bibleProps : BibleProps = []
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

    private getFirstPossible() : number {
        const currentElem = this.currentPlaylistElem?.available?.sort((a,b) => a.book - b.book);

        if (!this.playlistActive || !currentElem) {
            return this.getDistance([0, 0, 0])
        }
        
        const firstBook = currentElem[0].book
        let firstChapter : number
        let firstVerse : number
        if (currentElem[0].chapters) {
            const currentChapterElem = currentElem[0].chapters.sort((a,b) => a.chapter - b.chapter)
            firstChapter = currentChapterElem[0].chapter

            if (currentChapterElem[0].verses) {
                const currentVerseElem = currentChapterElem[0].verses.sort((a,b) => a - b)
                firstVerse = currentVerseElem[0]
            } else {
                firstVerse = 0
            }

        } else {
            firstChapter = 0
            firstVerse = 0
        }
        return this.getDistance([firstBook, firstChapter, firstVerse])
    }

    private getLastPossible() : number {
        const currentElem = this.currentPlaylistElem?.available?.sort((a,b) => a.book - b.book);

        let lastBook : number
        let lastChapter : number
        let lastVerse : number

        if (!this.playlistActive || !currentElem) {
            lastBook = this.bible.length - 1
            lastChapter = this.bible[lastBook].chapters.length - 1
            lastVerse = this.bible[lastBook].chapters[lastChapter].length - 1
        } else {
            lastBook = currentElem.at(-1)!.book

            if (currentElem.at(-1)!.chapters!) {
                const currentChapterElem = currentElem.at(-1)!.chapters!.sort((a,b) => a.chapter - b.chapter)
                lastChapter = currentChapterElem.at(-1)!.chapter
    
                if (currentChapterElem.at(-1)!.verses) {
                    const currentVerseElem = currentChapterElem.at(-1)!.verses!.sort((a,b) => a - b)
                    lastVerse = currentVerseElem.at(-1)!
                } else {
                    lastVerse = this.bible[lastBook].chapters[lastChapter].length - 1
                }
    
            } else {
                lastChapter = this.bible[lastBook].chapters.length - 1
                lastVerse = this.bible[lastBook].chapters[lastChapter].length - 1
            }
        }
        return this.getDistance([lastBook, lastChapter, lastVerse])
    }

    // TODO: look again into it
    private getDistance(verse: Array<number>) {
        const currentElem = this.currentPlaylistElem?.available?.sort((a,b) => a.book - b.book);
        const bookIndex = this.playlistActive && currentElem ? currentElem.findIndex(e => e.book == verse[0]) : verse[0]
        const bookNumber = this.playlistActive && currentElem ? currentElem[bookIndex].book : bookIndex

        let distance = 0;

        for(let i = 0; i < bookIndex; i++) {
            if (this.playlistActive && currentElem && currentElem[i].chapters) {
                currentElem[i].chapters!.sort((a,b) => (a.chapter - b.chapter)).forEach(c => {
                    distance += c.verses ? 
                        c.verses.length : 
                        this.bible[currentElem[i].book].chapters[c.chapter].length
                })
            } else {
                const currentBook = this.playlistActive && currentElem ? currentElem[i].book : i
                this.bible[currentBook].chapters.forEach(c => {
                    distance += c.length;
                });
            }
        }

        if (this.playlistActive && currentElem && currentElem[bookIndex].chapters) {
            const currentChapterElem = currentElem[bookIndex].chapters!
            const chapterIndex = currentChapterElem
                .sort((a,b) => (a.chapter - b.chapter))
                .findIndex(e => e.chapter == verse[1])

            for(let i = 0; i < chapterIndex; i++) {
                distance += currentChapterElem[i].verses ?
                    currentChapterElem[i].verses!.length :
                    this.bible[bookNumber].chapters[currentChapterElem[i].chapter].length;
            }

            distance += currentChapterElem[chapterIndex]?.verses ?
                currentChapterElem[chapterIndex].verses!
                    .sort((a,b) => a - b)
                    .findIndex(v => v == verse[2]) :
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