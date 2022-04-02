export interface Admin {
    id: string
    socketid: string
    room: string
}

export class Player {
    name: string
    id: string
    socketid: string
    points: number
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
    time : number,
    guess: [number, number, number]
}

export interface PlaylistElem {
    time: number
    selection: Array<{
        book: number,
        chapters?: Array<{
            chapter: number,
            verses?: Array<number>
        }>
    }>
}

export interface BibleBook {
    'abbrev' : string,
    'chapters': Array<Array<string>>
    'name': string
}

export interface chapterProps {
    'name' : string,
    'chapterLength': Array<number>
}