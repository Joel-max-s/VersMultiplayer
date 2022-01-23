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
    history: Array<Array<number>> = []
    currentTipPoints: number = 0

    constructor(id: string, sid: string) {
        this.id = id
        this.socketid = sid
    }
}

export interface PlaylistElem {
    time: number
    selection: Array<{
        book: number,
        chapers?: Array<{
            chaper: number,
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