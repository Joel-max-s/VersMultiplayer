// Histroy vernünftig implementieren
// Timer verbessern -> so das die duration beim vers mit kommt

import { chapterProps, Player, Playlist, PlaylistElem } from "./datatypes";
import { getIO } from "./server";
import { generateBooksList, getBible } from "./utils";
import { VerseHandler } from "./verses";

export class Room {
    //make better admin
    admin: string
    id: string
    players: Map<string, Player> = new Map()
    history: Array<Array<number>>
    selectedBooks: Array<number> = generateBooksList()
    timeLeft: number
    countdown: NodeJS.Timeout = null
    vh: VerseHandler
    private bibleP: Array<chapterProps>

    constructor(id: string, admin: string) {
        this.id = id
        this.admin = admin
        this.vh = new VerseHandler()
        this.bibleP = this.vh.generateBibleProps()
    }

    public startVerse() : {verse: string, time: number} {
        this.resetTipPoints()
        let time = this.vh.generateVerse()

        this.controlTimer({time: time})

        return {verse: this.vh.verse.text, time: time}
    }

    public stopVerse() {
        this.players.forEach((player: Player) => {
            player.points += player.currentTipPoints
        })
    }

    // wenn noch kein Timer gestartet wurde einen starten
    // wenn der Timer bereits läuft ihn erhöhen oder verringern, bei bedarf auch stoppen
    public controlTimer({ time = 0, endTimer = false }: { time?: number, endTimer?: boolean }) {
        if (this.countdown === null && time > 0) {
            console.log(time)
            this.startTimer(time)
            return
        }
        else if (this.countdown != null) {
            endTimer ? this.stopTimer() : this.changeTimer(time)
        }
    }

    public addPlayer(id: string, sid: string) {
        if (this.players.has(id)) {
            this.players.get(id).socketid = sid
        }
        this.players.set(id, new Player(id, sid))
    }

    public removePlayer(player: Player) {
        this.players.delete(player.id)
    }

    public finishVerse() {
        let results = []
        this.controlTimer({ endTimer: true });
        this.players.forEach(player => {
            if (player.allowedToSend) {
                player.allowedToSend = false;
                player.history.push({time: -1, guess: [-1, -1, -1]})
            }
            player.points += player.currentTipPoints;

            const resElem = {
                "name" : player.name,
                "points" : player.points,
                "currentTipPoints" : player.currentTipPoints
            }

            const playerElem = {
                "points": player.currentTipPoints,
                "rightAnswer": this.vh.verse,
                // @ts-ignore
                "guess" : player.history.at(-1)
            }

            // abgleich ob antwort richtig war
            getIO().to(player.socketid).emit('singleFinishVerseResult', playerElem)

            results.push(resElem)
        });
        return results
    }

    private startTimer(time: number) {
        this.timeLeft = time

        getIO().in(this.id).emit('timer', this.timeLeft)
        this.countdown = setInterval(() => {
            if (this.timeLeft > 0) this.timeLeft--
            else if (this.timeLeft <= 0) {
                this.stopTimer()
                this.finishVerse()

                //Test
                console.log(this.players)
            }
        }, 1000)


        // this.countdown = setInterval(() => {
        //     getIO().in(this.id).emit('timer', this.timeLeft)
        //     if (this.timeLeft > 0) this.timeLeft--
        //     else if (this.timeLeft <= 0) {
        //         this.stopTimer()
        //         // ergebnisse Senden

        //         //Test
        //         console.log(this.players)
        //     }
        // }, 1000)
    }

    private changeTimer(time: number) {
        if (this.timeLeft + time > 0)
            this.timeLeft += time
    }

    private stopTimer() {
        clearInterval(this.countdown)
        this.countdown = null
        this.timeLeft = 0
    }

    private resetTipPoints() {
        this.players.forEach((player: Player) => {
            player.currentTipPoints = 0;
            player.allowedToSend = true;
        });
    }

    public getCurrentVerse() {
        const v = this.vh.verse.text
        const verse = v != null ? v : "Aktuell ist noch kein Vers vorhanden"
        return(verse)
    }
    
    public getBibleProps() {
        return this.bibleP
    }

    public handleGuess(playerId: string, guess: [number, number, number]) {
        let msg = ""
        const player = this.players.get(playerId)
        if (player.allowedToSend) {
            const points = this.vh.calculatePoints(guess)
            player.allowedToSend = false
            
            // TODO: calculate time
            player.history.push({time: -1, guess: guess})
            msg = this.vh.stringifyverseList(guess) + " wurde gesendet."
        } 
        else { 
            // TODO: prüfung ob es eine history gibt um eventuelle Fehler zu vermeiden
            // @ts-ignore
            const verse = this.vh.stringifyverseList(player.history.at(-1))
            msg = verse + " wurde bereits gesendet. Nur der die erste Einsendung wird gewertet"
        }
        return msg
    }

    public loadPlaylist(playlist: Playlist, enablePlaylist : boolean = false) {
        this.vh.bible = getBible(playlist.bible)
        this.vh.playlistElems = playlist.elems.entries()
        this.vh.playlistActive = enablePlaylist
    }

    public pausePlaylist() {
        this.vh.playlistActive = false
    }

    public continuePlaylist() {
        this.vh.playlistActive = true
    }

    public setAvailableBooks(books : Array<number>) {
        this.vh.setAvailableBooks(books)
    }
}