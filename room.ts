// alle Spieler tracken
// die Verse Senden
// sich um die Zeit kümmern

import { Player, Playlist } from "./datatypes";
import { getIO } from "./server";

export class Room {
    id: string
    players: Map<string, Player> = new Map()
    history: Array<Array<number>>
    activeVerse: string
    selectedBooks: Array<number>
    timeLeft: number
    timeBonus: number
    playlist: Array<Playlist>
    playlistActive: boolean
    countdown: NodeJS.Timeout = null

    constructor(id: string) {
        this.id = id
    }

    // wenn noch kein Timer gestartet wurde einen starten
    // wenn der Timer bereits läuft ihn erhöhen oder verringern, bei bedarf auch stoppen
    controlTimer({ time = 0, endTimer = false }: { time?: number, endTimer?: boolean }) {
        if (this.countdown === null && time > 0) {
            console.log(time)
            this.startTimer(time)
            return
        }
        else if (this.countdown != null) {
            endTimer ? this.stopTimer() : this.changeTimer(time)
        }
    }

    addPlayer(id: string, sid: string) {
        if(this.players.has(id)) {
            this.players.get(id).socketid = sid
        }
        this.players.set(id, new Player(id, sid))
    }

    removePlayer(player : Player) {
        this.players.delete(player.id)
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
}