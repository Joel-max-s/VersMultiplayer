// Histroy vernünftig implementieren
// Timer verbessern -> so das die duration beim vers mit kommt

import { chapterProps, GuessProcessed, Player, Playlist, Result, VerseStarted } from "./datatypes";
import { getIO } from "./server";
import { generateBooksList, getBible } from "./utils";
import { VerseHandler } from "./verses";

export class Room {
    //make better admin
    verseAlreadFinished = false
    initalTime = -1
    admin: string
    id: string
    players: Map<string, Player> = new Map()
    history: Array<Array<number>> = []
    selectedBooks: Array<number> = generateBooksList()
    timeLeft: number = 0
    countdown?: NodeJS.Timeout = undefined
    vh: VerseHandler
    private bibleP: Array<chapterProps>

    constructor(id: string, admin: string) {
        this.id = id
        this.admin = admin
        this.vh = new VerseHandler()
        this.bibleP = this.vh.generateBibleProps()
    }

    public startVerse() : VerseStarted {
        this.verseAlreadFinished = false;
        this.resetTipPoints()
        const gen = this.vh.generateVerse()

        let time = undefined
        let available = undefined

        if (gen) {
            time = gen.time
            available = gen.available
        }

        this.controlTimer({endTimer: true})
        this.controlTimer({time: time})

        return {
            verse: this.vh.verse.text,
            // time: time,
            available: available,
            playlistActive: this.vh.playlistActive
        }
    }

    public stopVerse() {
        this.players.forEach((player: Player) => {
            player.points += player.currentTipPoints
        })
    }

    // wenn noch kein Timer gestartet wurde einen starten
    // wenn der Timer bereits läuft ihn erhöhen oder verringern, bei bedarf auch stoppen
    public controlTimer({ time = 0, endTimer = false}: { time?: number, endTimer?: boolean}) {
        if (this.countdown == undefined && time > 0) {
            console.log(time)
            this.startTimer(time)
            return
        }
        else if (this.countdown != undefined) {
            endTimer ? this.stopTimer() : this.changeTimer(time)
        }
    }

    public addPlayer(id: string, sid: string, name?: string) {
        if (this.players.has(id)) {
            this.players.get(id)!.socketid = sid
        }
        this.players.set(id, new Player(id, sid, name))
    }

    public removePlayer(player: Player) {
        this.players.delete(player.id)
    }

    public finishVerse() : Array<Result> {
        this.controlTimer({ endTimer: true });
        if (!this.verseAlreadFinished) {
            this.verseAlreadFinished = true;
            this.players.forEach(player => {
                if (player.allowedToSend) {
                    player.allowedToSend = false;
                    player.history.push({time: -1, guess: [-1, -1, -1], distance: -1, points: 0})
                }
                player.points += player.history.at(-1)!.points
    
                const playerElem = {
                    "points": player.history.at(-1)!.points,
                    "distance" : player.history.at(-1)!.distance,
                    "rightAnswer": this.vh.verse.list,
                    "guess" : player.history.at(-1)!.guess
                }
    
                // abgleich ob antwort richtig war
                getIO().to(player.socketid).emit('singleFinishVerseResult', playerElem)
            });
        }
        return this.getPlayerStats();
    }

    // TODO
    public getPlayerStats() : Array<Result> {
        let elems : Array<Result> = []
        this.players.forEach(player  => {
            elems.push({
                "name" : player.name,
                "points" : player.points,
                "distance" : player.history.at(-1)!.distance,
                "currentTipPoints" : player.history.at(-1)!.points
            })
        })
        return elems;
    }

    private startTimer(time: number) {
        console.log(`starting timer with ${time} seconds`)
        this.timeLeft = time
        this.initalTime = time

        this.countdown = setInterval(() => {
            if (this.timeLeft > 0) {
                getIO().in(this.id).emit('timer', {timeLeft: this.timeLeft, initialTime: this.initalTime})
                this.timeLeft--
            }
            else if (this.timeLeft <= 0) {
                this.stopTimer()
                const res = this.finishVerse()
                getIO().in(this.id).emit('finishedVerse', res)

                //Test
                console.log(this.players)
            }
        }, 1000)
    }

    private changeTimer(time: number) {
        console.log(`changing timer by ${time}`)
        if (this.timeLeft + time > 0) {
            this.timeLeft += time
            this.initalTime += time
            getIO().in(this.id).emit('timer', {timeLeft: this.timeLeft, initialTime: this.initalTime})
        }

            
    }

    private stopTimer() {
        console.log('stopping timer')
        clearInterval(this.countdown)
        this.countdown = undefined
        this.timeLeft = 0
        getIO().in(this.id).emit('timer', {timeLeft: -1, initialTime: this.initalTime})
    }

    private resetTipPoints() {
        this.players.forEach((player: Player) => {
            player.currentTipPoints = 0;
            player.allowedToSend = true;
        });
    }

    public getCurrentVerse() : VerseStarted {
        const v = this.vh.verse.text
        const verse = v ?? "Aktuell ist noch kein Vers vorhanden"
        
        return {
            verse : verse,
            playlistActive: this.vh.playlistActive,
            time: this.timeLeft == 0 ? -1 : this.timeLeft,
            available: this.vh.currentPlaylistElem?.available
        }
    }
    
    public getBibleProps() {
        return this.bibleP
    }

    public handleGuess(playerId: string, guess: [number, number, number]) : GuessProcessed {
        const player = this.players.get(playerId)
        let verse = guess;
        let firstGuess = true;
        if (player?.allowedToSend) {
            const res = this.vh.calculatePoints(guess)
            player.allowedToSend = false
            
            // TODO: calculate time
            player.history.push({time: -1, guess: guess, distance: res.abstand, points: res.punkte})
        } 
        else { 
            // TODO: prüfung ob es eine history gibt um eventuelle Fehler zu vermeiden
            firstGuess = false
            verse = player!.history.at(-1)!.guess
        }
        return { guess: verse, wasFirstGuess: firstGuess}
    }

    public loadPlaylist(playlist: Playlist, enablePlaylist : boolean = false) {
        this.vh.currentPlaylistElem = undefined;
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
}