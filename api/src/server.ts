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
        rooms.set(roomID, new Room(roomID, uuid))
        socket.emit('room created', { roomID: roomID })
        console.log(`Room ${roomID} was created`)
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
        const res = rooms.get(msg.rid)?.finishVerse()
        io.in(msg.rid).emit('finishedVerse', res)
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