import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { Playlist } from "./datatypes";
import { Room } from "./room";
import { getRandomNumber } from "./utils";

const app = express();
const http = createServer(app);
http.listen(3000);
const io = new Server(http, { pingTimeout: 120000, pingInterval: 5000, cors: {origin: "*"}, allowEIO3: true});
const rooms = new Map<string, Room>()

app.use(express.static('public'))

console.log('JEAH')

io.on("connection", (socket) => {
    socket.on('foo', () => {
        socket.emit('bar', 'Hello from express :)')
    })

    socket.on('create Room', (uuid: string) => {
        // später noch überprüfen ob es die schon gibt
        var roomID: string = (1000000 + getRandomNumber(8999999)).toString()
        socket.join(roomID.toString())
        rooms.set(roomID, new Room(roomID, {id: uuid, socketid: socket.id}))
        socket.emit('room created', { roomID: roomID })
        console.log(`Room ${roomID} was created`)
    })

    socket.on('rejoinAdmin', (msg: {pid: string, rid: string}) => {
        if (rooms.has(msg.rid)) {
            const room = rooms.get(msg.rid)!
            if (room.rejoinAdmin({id: msg.pid, socketid: socket.id})) {
                socket.join(msg.rid)
                socket.emit('admin rejoined', {roomID: msg.rid})
                console.log(`admin rejoined room ${msg.rid}`)
                return
            }
        }
        socket.emit('roomNotAvailableError')
        console.log(`admin with pid=${msg.pid} is not able/allowed to join room id=${msg.rid}`)
    })

    socket.on("join Room", (msg: { rid: string, pid: string, sid: string, name?: string}) => {
        var room: string = msg.rid
        var player: string = msg.pid
        var socketid: string = msg.sid
        if (rooms.has(room)) {
            rooms.get(room)!.addPlayer(player, socketid, msg.name)
            socket.join(room)
            socket.emit('joined room', { roomID: room })
            io.in(msg.rid).emit('finishedVerse', rooms.get(room)!.getPlayerStats())

            console.log(`${msg.name} with sockedId=${socketid} and playerId=${player} joined room=${room}`)
        }
        else {
            socket.emit('roomNotAvailableError')
            console.log(`${msg.name} with sockedId=${socketid} and playerId=${player} faild to join room=${room}`)
        }
    })

    socket.on("spectate Room", (msg: {rid: string}) => {
        if (rooms.has(msg.rid)) {
            socket.join(msg.rid);
            socket.emit('joined spectating', {roomID: msg.rid})
            io.in(msg.rid).emit('finishedVerse', rooms.get(msg.rid)!.getPlayerStats())
            
            console.log(`Somebody joined spectating Room ${msg.rid}`)
        } else {
            socket.emit('roomNotAvailableError')
            console.log(`Somebody tryed joining to spectate room ${msg.rid} but room is not available`)
        }
    })

    // TODO: just admin is allowed to do this
    // TODO: teamName is not allowed to be empty
    // TODO: safety checks
    socket.on("create Team", (msg: {rid: string, pid: string, teamName: string}) => {
        if (!rooms.has(msg.rid)) {
            socket.emit('roomNotAvailableError')
            return
        }

        const room = rooms.get(msg.rid)!
        const teamId = room.creteTeam(msg.teamName)
        const createdTeam = room.getTeam(teamId)
        const teams = room.getTeams()
        
        io.in(msg.rid).emit("availableTeams", teams)
        socket.emit("created Team", createdTeam)
        console.log(`Created Team with id=${teamId}, name="${msg.teamName}"`)
    })

    socket.on("remove Team", (msg: {rid: string, pid: string, teamId: number}) => {
        if (!rooms.has(msg.rid)) {
            socket.emit('roomNotAvailableError')
            return
        }
        
        const room = rooms.get(msg.rid)!
        const deletedTeam = room.getTeams().find(t => t.id === msg.teamId)
        const teamGotDeleted = room.removeTeam(msg.teamId)

        if (deletedTeam == undefined || !teamGotDeleted) {
            socket.emit("teamRemoveError")
            return
        }

        const teams = room.getTeams()
        io.in(msg.rid).emit("availableTeams", teams)
        socket.emit("removed Team", deletedTeam)
        console.log(`Team id=${deletedTeam.id} with name=${deletedTeam.name} got deleted`)
    })

    socket.on("join Team", (msg: {rid: string, pid: string, teamId: number}) => {
        if (!rooms.has(msg.rid)) {
            socket.emit('roomNotAvailableError')
            return
        }

        const room = rooms.get(msg.rid)!
        const teamId = room.joinTeam(msg.teamId, msg.pid)
        const joinedTeam = room.getTeam(teamId)

        if (teamId == -1 || joinedTeam == undefined) {
            socket.emit("teamJoinError")
            return
        }

        socket.emit("joined Team", joinedTeam)
        io.in(msg.rid).emit('finishedVerse', room.getPlayerStats())
        console.log(`Player pid=${msg.pid} joined Team teamId=${teamId} with name=${joinedTeam.name}`)
    })

    socket.on("leave Team", (msg: {rid: string, pid: string, teamId: number}) => {
        if (!rooms.has(msg.rid)) {
            socket.emit('roomNotAvailableError')
            return
        }

        const room = rooms.get(msg.rid)!
        const leftTeam = room.getTeam(msg.teamId)
        const hasLeftTeam = room.leaveTeam(msg.teamId, msg.pid)

        if (!hasLeftTeam || leftTeam == undefined) {
            socket.emit("teamLeaveError")
            return
        }
        
        socket.emit("leaved Team", leftTeam)
        console.log(`Player id=${msg.pid} left the Team id=${leftTeam.id} with name=${leftTeam.name}`)
    })

    // if no teams are in the room an empty array gets returned
    socket.on("getTeams", (msg: {rid: string}) => {
        if (!rooms.has(msg.rid)) {
            socket.emit('roomNotAvailableError')
            return
        }

        const teams = rooms.get(msg.rid)!.getTeams();
        socket.emit("availableTeams", teams)
    })

    // if no teams are in the room the requesting socket gets an error
    socket.on("requestJoinTeams", (msg: {rid: string, pid:string}) => {
        if (!rooms.has(msg.rid)) {
            socket.emit('roomNotAvailableError')
            return
        }

        const room = rooms.get(msg.rid)!
        const teams = room.getTeams();

        if (teams.length < 1) {
            socket.emit('errorRequestingTeams')
            return
        }

        io.in(msg.rid).emit("requestToJoinTeam", teams)
        console.log(`Den Spielern wurde die Teams gezeigt`)
    })

    socket.on('message', (msg: { room: string, text: string }) => {
        io.to(msg.room).emit('message', { text: msg.text })
    })

    socket.on('getBibleProps', (msg: {rid: string}) => {
        const props = rooms.get(msg.rid)?.getBibleProps()
        socket.emit('bibleProps', props)
    })

    socket.on('getVerse', (msg: { rid: string }) => {
        const verse = rooms.get(msg.rid)?.getCurrentVerse()
        socket.emit('sendVerse', verse)
    })

    socket.on('sendGuess', (msg: { rid: string, pid: string, guess: [number, number, number] }) => {
        const res = rooms.get(msg.rid)?.handleGuess(msg.pid, msg.guess)
        socket.emit('guessProcessed', res)
    })

    //TODO: add that just admin can do this
    socket.on('startVerse', (msg: {rid: string}) => {
        const res = rooms.get(msg.rid)?.startVerse()
        io.in(msg.rid).emit('startedVerse', res)
    })

    //TODO: add that just admin can do this
    socket.on('finishVerse', (msg: {rid: string}) => {
        if (rooms.has(msg.rid)) {
            const room = rooms.get(msg.rid)!
            room.finishVerse()
            io.in(msg.rid).emit('finishedVerse', room.getPlayerStats())
            io.in(msg.rid).emit('availableTeams', room.getTeams())
            return
        }
        socket.emit('roomNotAvailableError')
    })

    //TODO: add that just admin can do this
    socket.on('setPlaylist', (msg: {rid: string, playlist: Playlist}) => {
        rooms.get(msg.rid)?.loadPlaylist(msg.playlist, true)
    })

    //TODO: add that just admin can do this
    socket.on('stopPlaylist', (msg: {rid: string}) => {
        rooms.get(msg.rid)?.pausePlaylist()
    })

    //TODO: add that just admin can do this
    socket.on('continuePlaylist', (msg: {rid: string}) => {
        rooms.get(msg.rid)?.continuePlaylist()
    })

    //TODO: add that just admin can do this
    socket.on('increaseTimer', (msg: {rid: string, time: number}) => {
        rooms.get(msg.rid)?.controlTimer({time: msg.time})
    })

    //TODO: add that just admin can do this
    socket.on('stopTimer', (msg: {rid: string}) => {
        rooms.get(msg.rid)?.controlTimer({endTimer: true})
    })
});

export function getIO() {
    return io
}