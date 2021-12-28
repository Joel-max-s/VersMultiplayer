// alle Spieler tracken
// die Verse Senden
// sich um die Zeit kümmern

import { Player, PlaylistElem } from "./datatypes";
import { getIO } from "./server";
import { generateBooksList } from "./utils";
import { VerseHandler } from "./verses";

export class Room {
    id: string
    players: Map<string, Player> = new Map()
    history: Array<Array<number>>
    selectedBooks: Array<number> = generateBooksList()
    timeLeft: number
    countdown: NodeJS.Timeout = null
    vh: VerseHandler

    constructor(id: string) {
        this.id = id
        this.vh = new VerseHandler()
    }

    //TODO: build game loop
    public startVerse() {
        this.resetTipPoints()
        this.vh.generateVerse()

        //TODO: send generated verse        
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
        this.controlTimer({ endTimer: true });
        this.players.forEach(player => {
            player.allowedToSend = false;
            player.points += player.currentTipPoints;
            // TODO: send result
            // getIO().to(this.id).emit('tipp income', {eval})
        });
        // TODO: better solution, just points maybe
        // getIO().to(this.id).emit('finish verse', this.players)
    }

    private startTimer(time: number) {
        this.timeLeft = time
        this.countdown = setInterval(() => {
            getIO().to(this.id).emit('timer', this.timeLeft + ' Sekunden')
            if (this.timeLeft > 0) this.timeLeft--
            else if (this.timeLeft <= 0) {
                this.stopTimer()
                // ergebnisse Senden

                //Test
                console.log(this.players)
            }
        }, 1000)
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
}