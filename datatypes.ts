export interface Admin {
    id : string
    socketid : string
    room : string
}

export class Player {
    name : string
    id : string
    socketid : string
    points : number
    allowedToSend : boolean
    connected : boolean
    team : number
    room : string
    history : Array<Array<Number>>

    constructor(id : string, sid : string) {
        this.id = id
        this.socketid = sid
    }
}

export interface Playlist {
    zeit: number
    auswahl : Array<number>
    versL: Array<number>
    versS : string
}