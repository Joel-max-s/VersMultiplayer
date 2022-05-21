import { uniqueNamesGenerator, Config, names } from 'unique-names-generator';

export interface Admin {
    id: string
    socketid: string
    room: string
}

export class Player {
    name: string = uniqueNamesGenerator({ dictionaries: [names] })
    id: string
    socketid: string
    points: number = 0
    allowedToSend: boolean = true
    connected: boolean
    team: number
    room: string
    history: Array<HistoryElem> = []
    currentTipPoints: number = 0

    constructor(id: string, sid: string) {
        this.id = id
        this.socketid = sid
    }
}

export interface HistoryElem {
    time: number,
    guess: [number, number, number]
}

export interface Playlist {
    bible: string,
    elems: Array<PlaylistElem>
}

export interface PlaylistElem {
    time?: number,
    selection: PlaylistSelection,
    available?: PlaylistSelection
}

export type PlaylistSelection =
    Array<{
        book: number,
        chapters?: Array<{
            chapter: number,
            verses?: Array<number>
        }>
    }>


export interface BibleBook {
    'abbrev': string,
    'chapters': Array<Array<string>>
    'name': string
}

export interface chapterProps {
    'name': string,
    'chapterLength': Array<number>
}

export interface GuessProcessed {
    guess: [number, number, number],
    wasFirstGuess: boolean
}

export interface VerseStarted { 
    verse: string,
    time?: number,
    available?: PlaylistSelection,
    playlistActive: boolean
}