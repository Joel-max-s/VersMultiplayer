import { uniqueNamesGenerator, names } from 'unique-names-generator';

export interface Admin {
    id: string
    socketid: string
}

export class Player {
    name: string 
    id: string
    socketid: string
    points: number = 0
    allowedToSend: boolean = true
    connected: boolean = false
    team: number
    room: string = ""
    history: Array<HistoryElem> = []
    currentTipPoints: number = 0

    constructor(id: string, sid: string, name?: string, team?: number) {
        this.id = id
        this.socketid = sid
        this.name = name ?? uniqueNamesGenerator({ dictionaries: [names] })
        this.team = team ?? -1
    }
}

export class Team {
    name: string
    id: number
    members: Map<string, Player>
    points: number = 0
    currentPoints: number = 0

    constructor(id: number, name: string, members?: Map<string, Player>) {
        this.id = id
        this.name = name
        this.members = members ?? new Map()
    }
}

export interface HistoryElem {
    time: number,
    guess: [number, number, number],
    distance: number,
    points: number,
}

export interface Playlist {
    bible: string,
    elems: Array<PlaylistElem>
}

export interface PlaylistElem {
    endless?: boolean,
    repeat?: number,
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

export type BibleProps = Array<{
    name: string,
    chapterLength: Array<number>
}>

export type Nullable<T> = T | null;

export interface Result {
    name: string
    points: number
    distance: number
    currentTipPoints: number
    team: number
}

export interface TeamResult {
    id: number
    name: string
    points: number
    lastPoints: number
}