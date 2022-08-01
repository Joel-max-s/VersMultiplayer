// Histroy vernünftig implementieren
// TODO: wenn noch kein Vers geladen ist keine Punkte berechnen

import { Admin, chapterProps, GuessProcessed, Player, Playlist, Result, Team, TeamResult, VerseStarted } from "./datatypes";
import { getIO } from "./server";
import { generateBooksList, getBible } from "./utils";
import { VerseHandler } from "./verses";

export class Room {
    //make better admin
    verseAlreadFinished = false
    initalTime = -1
    admin: Admin
    id: string
    players: Map<string, Player> = new Map()
    history: Array<Array<number>> = []
    selectedBooks: Array<number> = generateBooksList()
    timeLeft: number = 0
    countdown?: NodeJS.Timeout = undefined
    vh: VerseHandler
    private bibleP: Array<chapterProps>
    private teams: Map<number, Team> = new Map()

    constructor(id: string, admin: Admin) {
        this.id = id
        this.admin = admin
        this.vh = new VerseHandler()
        this.bibleP = this.vh.generateBibleProps()
    }

    // handle players
    public addPlayer(id: string, sid: string, name?: string) {
        if (this.players.has(id)) {
            let player = this.players.get(id)
            player!.socketid = sid;
            player!.name = name ?? 'unknown'
            return
        }
        this.players.set(id, new Player(id, sid, name))
    }

    public removePlayer(player: Player) {
        this.players.delete(player.id)
    }

    public rejoinAdmin(newAdmin: Admin) : boolean {
        if (this.admin.id === newAdmin.id) {
            this.admin = newAdmin;
            return true
        }
        return false
    }


    // handle Game
    public resetGame() {
        this.players.forEach(player => player.reset())
        this.teams.forEach(team => {
            team.currentPoints = 0
            team.points = 0
        })
    }
    
    // handle Teams
    public creteTeam(teamName: string) : number {
        const ids = [...this.teams.values()].map(t => t.id)
        const teamId = ids.length > 0 ? Math.max(...ids) + 1 : 0
        const team = new Team(teamId, teamName)
        this.teams.set(teamId, team)
        return teamId
    }

    public removeTeam(teamId: number) : boolean {
        this.players.forEach(p => {
            if(p.team == teamId) p.team = -1
        })
        return this.teams.delete(teamId)
    }

    public joinTeam(teamId: number, playerId: string) : number {
        if (!this.players.has(playerId)) return -1
        this.leaveTeam(teamId, playerId)

        let res = this.teams.get(teamId)?.members.set(playerId, this.players.get(playerId)!)
        if (res == undefined) return -1
        
        this.players.get(playerId)!.team = teamId
        return res ? teamId : -1;
    }

    public leaveTeam(teamId: number, playerId: string) : boolean {
        if (this.players.has(playerId)) {
            this.players.get(playerId)!.team = -1
        }
        if (!this.teams.has(teamId)) {
            return false
        }
        return this.teams.get(teamId)!.members.delete(playerId);
    }

    // TODO: test this
    private calculateTeamPoints(results: Array<Result>) {
        const RATIO = 0.4
        const teams = [...this.teams.values()]
        const MIN_PLAYERS = Math.min(...teams.map(t => t.members.size))
        const BEST_PLAYERS = Math.ceil(MIN_PLAYERS * RATIO)

        this.teams.forEach(t => {
            const sorted = results.map(r => r.currentTipPoints).sort((a, b) => b - a)
            let points = 0
            for (let i = 0; i < BEST_PLAYERS; i++) {
                points += sorted[i]
            }
            t.currentPoints = points
            t.points += points
        })
    }


    // handle verse
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

        console.log(`new verse is: ${this.vh.verse.text}`)
        console.log(`the verse stands in: ${this.vh.stringifyverseList(this.vh.verse.list)}`)

        return {
            verse: this.vh.verse.text,
            // time: time,
            available: available,
            playlistActive: this.vh.playlistActive
        }
    }

    public finishVerse() {
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
        const playerStats = this.getPlayerStats()
        this.calculateTeamPoints(playerStats)
        console.log(`finished verse ${this.vh.stringifyverseList(this.vh.verse.list)}`)
    }

    private resetTipPoints() {
        this.players.forEach((player: Player) => {
            player.currentTipPoints = 0;
            player.allowedToSend = true;
        });
    }

    
    // handle Guess
    public handleGuess(playerId: string, guess: [number, number, number]) : GuessProcessed {
        console.log(guess)
        const player = this.players.get(playerId)
        let verse = guess;
        let firstGuess = true;
        if (player?.allowedToSend) {
            const res = this.vh.calculatePoints(guess)
            player.allowedToSend = false
            
            // TODO: calculate time
            player.history.push({time: -1, guess: guess, distance: res.abstand, points: res.punkte})

            console.log(`${player.name} guessed ${this.vh.stringifyverseList(verse)}, the right answer is ${this.vh.stringifyverseList(this.vh.verse.list)}`)
        } 
        else { 
            // TODO: prüfung ob es eine history gibt um eventuelle Fehler zu vermeiden
            firstGuess = false
            verse = player!.history.at(-1)!.guess
            
            console.log(`${player!.name} guessed ${this.vh.stringifyverseList(guess)} but has already guessed ${this.vh.stringifyverseList(verse)}`)
        }
        return { guess: verse, wasFirstGuess: firstGuess}
    }

    

    // handle Timer
    // wenn noch kein Timer gestartet wurde einen starten
    // wenn der Timer bereits läuft ihn erhöhen oder verringern, bei bedarf auch stoppen
    public controlTimer({ time = 0, endTimer = false}: { time?: number, endTimer?: boolean}) {
        if (this.countdown == undefined && time > 0) {
            this.startTimer(time)
            return
        }
        else if (this.countdown != undefined) {
            endTimer ? this.stopTimer() : this.changeTimer(time)
        }
    }

    private startTimer(time: number) {
        this.timeLeft = time
        this.initalTime = time

        this.countdown = setInterval(() => {
            if (this.timeLeft > 0) {
                getIO().in(this.id).emit('timer', {timeLeft: this.timeLeft, initialTime: this.initalTime})
                this.timeLeft--
            }
            else if (this.timeLeft <= 0) {
                this.stopTimer()
                this.finishVerse()
                getIO().in(this.id).emit('finishedVerse', this.getPlayerStats())
                getIO().in(this.id).emit("availableTeams", this.getTeams())
            }
        }, 1000)

        console.log(`starting timer with ${time} seconds`)
    }

    private changeTimer(time: number) {
        if (this.timeLeft + time > 0) {
            this.timeLeft += time
            this.initalTime += time
            getIO().in(this.id).emit('timer', {timeLeft: this.timeLeft, initialTime: this.initalTime})

            console.log(`changed timer by ${time} seconds`)
        }
    }

    private stopTimer() {
        clearInterval(this.countdown)
        this.countdown = undefined
        this.timeLeft = 0
        getIO().in(this.id).emit('timer', {timeLeft: -1, initialTime: this.initalTime})

        console.log('stopping timer')
    }

    // handle Playlist stuff
    public loadPlaylist(playlist: Playlist, enablePlaylist : boolean = false) {
        this.vh.currentPlaylistElem = undefined;
        this.vh.bible = getBible(playlist.bible)
        this.vh.playlistElems = playlist.elems.entries()
        this.vh.playlistActive = enablePlaylist

        console.log(`loaded playlist with ${playlist.elems.length} elements`)
    }

    public pausePlaylist() {
        this.vh.playlistActive = false

        console.log('paused current Playlist')
    }

    public continuePlaylist() {
        this.vh.playlistActive = true

        console.log('continue current Playlist')
    }


    // getter and setter
    public getBibleProps() {
        return this.bibleP
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

    // TODO: wenn das in der Runde abgefragt wird kann man die Punkte vom letzten Tipp schon sehen bevor
    // die Runde "offiziell" ausgewertet wurde.
    public getPlayerStats() : Array<Result> {
        let elems : Array<Result> = []
        this.players.forEach(player  => {
            elems.push({
                "name" : player.name,
                "points" : player.points,
                "distance" : player.history.at(-1)?.distance ?? -1,
                "currentTipPoints" : player.history.at(-1)?.points ?? 0,
                "team" : player.team
            })
        })
        return elems;
    }

    public getTeams() : Array<TeamResult> {
        let elems : Array<TeamResult>  = []
        this.teams.forEach(t => {
            elems.push(this.getTeam(t.id)!)
        })
        return elems
    }

    public getTeam(teamId: number) : TeamResult | undefined {
        const team = this.teams.get(teamId);
        if (team == undefined) return
        return {
            id: team.id,
            name: team.name,
            points: team.points,
            lastPoints: team.currentPoints
        }
    }
}